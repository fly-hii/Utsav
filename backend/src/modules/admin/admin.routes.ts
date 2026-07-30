import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { superAdminOnly } from '../../middleware/roles';
import { hashPassword } from '../../utils/password';
import { sendSuccess, sendError, parsePagination, buildPaginationMeta } from '../../utils/response';
import { emitNotification } from '../../websocket/socket';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authenticate, superAdminOnly);

/**
 * GET /api/admin/dashboard - Overview
 */
router.get(
  '/dashboard',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const activeComm: any = await queryOne("SELECT COUNT(*) as total FROM committees WHERE status = 'APPROVED'");
      const pendingComm: any = await queryOne("SELECT COUNT(*) as total FROM committees WHERE status = 'PENDING'");
      const users: any = await queryOne('SELECT COUNT(*) as total FROM users');
      const donations: any = await queryOne('SELECT SUM(amount) as total FROM donations');
      const expenses: any = await queryOne('SELECT SUM(amount) as total FROM expenses');
      const reels: any = await queryOne('SELECT COUNT(*) as total FROM reels');

      const recentPendingCommittees = await query(
        "SELECT * FROM committees WHERE status = 'PENDING' ORDER BY createdAt DESC LIMIT 5"
      );

      for (const comm of recentPendingCommittees) {
        (comm as any).documents = await query('SELECT * FROM committee_documents WHERE committeeId = ?', [
          (comm as any).id,
        ]);
      }

      sendSuccess(res, {
        stats: {
          approvedCommittees: activeComm?.total || 0,
          pendingCommittees: pendingComm?.total || 0,
          totalUsers: users?.total || 0,
          totalDonationsAmount: donations?.total || 0,
          totalExpensesAmount: expenses?.total || 0,
          totalReels: reels?.total || 0,
        },
        recentPendingCommittees,
      });
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

/**
 * GET /api/admin/committees - Committee list
 */
router.get(
  '/committees',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, skip } = parsePagination(req.query);
      const { status, search } = req.query;

      let sql = 'SELECT * FROM committees WHERE 1=1';
      const params: any[] = [];

      if (status) {
        sql += ' AND status = ?';
        params.push(status);
      }
      if (search) {
        sql += ' AND (name LIKE ? OR templeName LIKE ? OR village LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      sql += ` ORDER BY createdAt DESC LIMIT ${Number(limit)} OFFSET ${Number(skip)}`;

      const committees = await query(sql, params);

      for (const c of committees) {
        (c as any).documents = await query('SELECT * FROM committee_documents WHERE committeeId = ?', [(c as any).id]);
        const membersCount: any = await queryOne('SELECT COUNT(*) as total FROM committee_members WHERE committeeId = ?', [(c as any).id]);
        (c as any)._count = { members: membersCount?.total || 0 };
      }

      const countRes: any = await queryOne('SELECT COUNT(*) as total FROM committees');

      sendSuccess(res, committees, 'Committees fetched', 200, buildPaginationMeta(countRes?.total || 0, page, limit));
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

/**
 * PUT /api/admin/committees/:id/approve - Approve committee
 */
router.put(
  '/committees/:id/approve',
  async (req: Request, res: Response): Promise<void> => {
    try {
      await query(
        "UPDATE committees SET status = 'APPROVED', approvedAt = NOW(), approvedBy = ? WHERE id = ?",
        [req.user!.userId, req.params.id]
      );

      const members = await query('SELECT userId FROM committee_members WHERE committeeId = ?', [
        req.params.id,
      ]);
      const committee: any = await queryOne('SELECT name FROM committees WHERE id = ?', [req.params.id]);

      for (const m of members) {
        const notifId = uuidv4();
        await query(
          `INSERT INTO notifications (id, userId, type, title, body, data)
           VALUES (?, ?, 'COMMITTEE_APPROVED', 'Committee Approved! 🎉', ?, ?)`,
          [
            notifId,
            (m as any).userId,
            `Your committee "${committee?.name}" has been approved by Admin. You can now log in.`,
            JSON.stringify({ committeeId: req.params.id }),
          ]
        );
        try {
          emitNotification((m as any).userId, {
            type: 'COMMITTEE_APPROVED',
            message: `Committee "${committee?.name}" approved!`,
          });
        } catch {}
      }

      sendSuccess(res, null, 'Committee approved successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

/**
 * PUT /api/admin/committees/:id/reject - Reject committee
 */
router.put(
  '/committees/:id/reject',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { reason } = req.body;
      await query(
        "UPDATE committees SET status = 'REJECTED', rejectionReason = ? WHERE id = ?",
        [reason || 'Requirements not met', req.params.id]
      );

      sendSuccess(res, null, 'Committee rejected');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

/**
 * PUT /api/admin/committees/:id/request-info - Request info
 */
router.put(
  '/committees/:id/request-info',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { message } = req.body;
      await query(
        "UPDATE committees SET status = 'INFO_REQUESTED', infoRequestMessage = ? WHERE id = ?",
        [message || 'More info needed', req.params.id]
      );

      sendSuccess(res, null, 'Requested more information');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

/**
 * PUT /api/admin/committees/:id/suspend - Suspend committee
 */
router.put(
  '/committees/:id/suspend',
  async (req: Request, res: Response): Promise<void> => {
    try {
      await query("UPDATE committees SET status = 'SUSPENDED' WHERE id = ?", [req.params.id]);
      sendSuccess(res, null, 'Committee suspended');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

/**
 * GET /api/admin/users - User administration
 */
router.get(
  '/users',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, skip } = parsePagination(req.query);
      const { search } = req.query;

      let sql = 'SELECT id, name, phone, email, role, isActive, createdAt FROM users WHERE 1=1';
      const params: any[] = [];

      if (search) {
        sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s);
      }

      sql += ` ORDER BY createdAt DESC LIMIT ${Number(limit)} OFFSET ${Number(skip)}`;

      const users = await query(sql, params);
      const countRes: any = await queryOne('SELECT COUNT(*) as total FROM users');

      sendSuccess(res, users, 'Users fetched', 200, buildPaginationMeta(countRes?.total || 0, page, limit));
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

/**
 * PUT /api/admin/users/:id/reset-password - Password reset
 */
router.put(
  '/users/:id/reset-password',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        sendError(res, 'Password must be at least 6 characters', 400);
        return;
      }

      const hashedPassword = await hashPassword(newPassword);
      await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.params.id]);

      sendSuccess(res, null, 'User password reset successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

export default router;
