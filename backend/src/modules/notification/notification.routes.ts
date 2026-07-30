import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { sendSuccess, sendError, parsePagination, buildPaginationMeta } from '../../utils/response';

const router = Router();

router.get(
  '/',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, skip } = parsePagination(req.query);
      const userId = req.user!.userId;

      const notifications = await query(
        `SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT ${Number(limit)} OFFSET ${Number(skip)}`,
        [userId]
      );

      const countRes: any = await queryOne('SELECT COUNT(*) as total FROM notifications WHERE userId = ?', [userId]);
      const unreadRes: any = await queryOne('SELECT COUNT(*) as total FROM notifications WHERE userId = ? AND isRead = 0', [userId]);

      sendSuccess(
        res,
        { notifications, unreadCount: unreadRes?.total || 0 },
        'Notifications fetched',
        200,
        buildPaginationMeta(countRes?.total || 0, page, limit)
      );
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

router.put(
  '/:id/read',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      await query('UPDATE notifications SET isRead = 1 WHERE id = ?', [req.params.id]);
      sendSuccess(res, null, 'Notification marked as read');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

router.put(
  '/read-all',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      await query('UPDATE notifications SET isRead = 1 WHERE userId = ?', [req.user!.userId]);
      sendSuccess(res, null, 'All notifications marked as read');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

export default router;
