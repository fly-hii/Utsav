import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { committeeRoleOrAbove, superAdminOnly } from '../../middleware/roles';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

/**
 * GET /api/reports/committee/:id/daily - Daily summary
 */
router.get(
  '/committee/:id/daily',
  authenticate,
  committeeRoleOrAbove,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const committeeId = req.params.id;
      const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];

      const donations: any = await queryOne(
        'SELECT SUM(amount) as total, COUNT(*) as count FROM donations WHERE committeeId = ? AND DATE(date) = ?',
        [committeeId, dateStr]
      );
      const expenses: any = await queryOne(
        'SELECT SUM(amount) as total, COUNT(*) as count FROM expenses WHERE committeeId = ? AND DATE(date) = ?',
        [committeeId, dateStr]
      );

      sendSuccess(res, {
        date: dateStr,
        donations: { amount: donations?.total || 0, count: donations?.count || 0 },
        expenses: { amount: expenses?.total || 0, count: expenses?.count || 0 },
        net: (donations?.total || 0) - (expenses?.total || 0),
      });
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

/**
 * GET /api/reports/platform - Admin platform stats
 */
router.get(
  '/platform',
  authenticate,
  superAdminOnly,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const activeComm: any = await queryOne("SELECT COUNT(*) as total FROM committees WHERE status = 'APPROVED'");
      const pendingComm: any = await queryOne("SELECT COUNT(*) as total FROM committees WHERE status = 'PENDING'");
      const users: any = await queryOne('SELECT COUNT(*) as total FROM users');

      const donations: any = await queryOne('SELECT SUM(amount) as total, COUNT(*) as count FROM donations');
      const expenses: any = await queryOne('SELECT SUM(amount) as total, COUNT(*) as count FROM expenses');
      const reels: any = await queryOne("SELECT COUNT(*) as total FROM reels WHERE status = 'PUBLISHED'");
      const events: any = await queryOne('SELECT COUNT(*) as total FROM events');

      sendSuccess(res, {
        committees: { active: activeComm?.total || 0, pending: pendingComm?.total || 0 },
        users: users?.total || 0,
        financials: {
          donationsAmount: donations?.total || 0,
          donationsCount: donations?.count || 0,
          expensesAmount: expenses?.total || 0,
          expensesCount: expenses?.count || 0,
        },
        reels: reels?.total || 0,
        events: events?.total || 0,
      });
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

export default router;
