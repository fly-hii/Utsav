import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { query, queryOne } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { committeeAdminOrAbove } from '../../middleware/roles';
import { validate } from '../../middleware/validate';
import { hashPassword, generateTempPassword, generateUsername } from '../../utils/password';
import { sendSuccess, sendCreated, sendError, sendNotFound } from '../../utils/response';
import { emitNotification } from '../../websocket/socket';
import { v4 as uuidv4 } from 'uuid';

const addMemberSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

const router = Router({ mergeParams: true });

/**
 * POST /api/committees/:id/members - Add member
 */
router.post(
  '/',
  authenticate,
  committeeAdminOrAbove,
  validate(addMemberSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const committeeId = req.params.id;
      const { name, phone, email, address, role } = req.body;

      // Verify requester is committee admin
      const requester: any = await queryOne(
        "SELECT id FROM committee_members WHERE committeeId = ? AND userId = ? AND role = 'ADMIN'",
        [committeeId, req.user!.userId]
      );

      if (!requester && req.user!.role !== 'SUPER_ADMIN') {
        sendError(res, 'Only committee admin can add members', 403);
        return;
      }

      // Check if user exists
      let user: any = await queryOne('SELECT id FROM users WHERE phone = ?', [phone]);
      let tempPassword: string | null = null;
      let userId: string;

      if (!user) {
        tempPassword = phone;
        const hashedPw = await hashPassword(phone);
        userId = uuidv4();

        await query(
          `INSERT INTO users (id, name, phone, email, password, role, address)
           VALUES (?, ?, ?, ?, ?, 'COMMITTEE_MEMBER', ?)`,
          [userId, name, phone, email || null, hashedPw, address || null]
        );
      } else {
        userId = user.id;
      }

      // Check if already member
      const existingMember: any = await queryOne(
        'SELECT id FROM committee_members WHERE userId = ? AND committeeId = ?',
        [userId, committeeId]
      );

      if (existingMember) {
        sendError(res, 'User is already a member of this committee', 409);
        return;
      }

      const memberId = uuidv4();
      await query(
        `INSERT INTO committee_members (id, userId, committeeId, role)
         VALUES (?, ?, ?, ?)`,
        [memberId, userId, committeeId, role]
      );

      // Create notification
      const notifId = uuidv4();
      const committee: any = await queryOne('SELECT name FROM committees WHERE id = ?', [committeeId]);

      await query(
        `INSERT INTO notifications (id, userId, type, title, body, data)
         VALUES (?, ?, 'MEMBER_ADDED', 'Added to Committee', ?, ?)`,
        [
          notifId,
          userId,
          `You have been added to ${committee?.name || 'committee'} as a ${role.toLowerCase()}.`,
          JSON.stringify({ committeeId }),
        ]
      );

      try {
        emitNotification(userId, {
          type: 'MEMBER_ADDED',
          message: `You have been added to ${committee?.name || 'committee'}`,
        });
      } catch {}

      sendCreated(
        res,
        {
          memberId,
          userId,
          committeeId,
          role,
          tempPassword,
          username: generateUsername(name, phone),
        },
        'Member added successfully'
      );
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

/**
 * GET /api/committees/:id/members - List members
 */
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const committeeId = req.params.id;
      let members: any = await query(
        `SELECT cm.id, cm.role, cm.joinedAt, u.id as userId, u.name, u.phone, u.email, u.avatar, u.avatarUrl
         FROM committee_members cm
         JOIN users u ON cm.userId = u.id
         WHERE cm.committeeId = ? AND cm.isActive = 1
         ORDER BY cm.joinedAt ASC`,
        [committeeId]
      );

      // Returning empty array if no members are found instead of random users

      sendSuccess(res, members);
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

/**
 * DELETE /api/committees/:id/members/:memberId - Remove member
 */
router.delete(
  '/:memberId',
  authenticate,
  committeeAdminOrAbove,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { memberId } = req.params;
      await query('DELETE FROM committee_members WHERE id = ?', [memberId]);
      sendSuccess(res, null, 'Member removed');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

export default router;
