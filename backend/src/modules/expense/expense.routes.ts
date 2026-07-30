import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { committeeRoleOrAbove } from '../../middleware/roles';
import { uploadDocument } from '../../middleware/upload';
import { uploadToS3, generateS3Key, S3_FOLDERS, deleteFromS3 } from '../../config/s3';
import { sendSuccess, sendCreated, sendError, sendNotFound, parsePagination, buildPaginationMeta } from '../../utils/response';
import { emitExpense, emitDashboardUpdate } from '../../websocket/socket';
import { v4 as uuidv4 } from 'uuid';

const router = Router({ mergeParams: true });

async function resolveCommitteeId(inputCommitteeId?: string): Promise<string> {
  if (inputCommitteeId) {
    const existing: any = await queryOne('SELECT id FROM committees WHERE id = ?', [inputCommitteeId]);
    if (existing) return existing.id;
  }
  const firstComm: any = await queryOne('SELECT id FROM committees ORDER BY createdAt ASC LIMIT 1');
  if (firstComm) return firstComm.id;

  const defaultId = uuidv4();
  await query(
    `INSERT INTO committees (id, name, templeName, festivalName, village, mandal, district, state, address, latitude, longitude, presidentName, secretaryName, phone, status)
     VALUES (?, 'Sri Rama Youth Committee', 'Sri Seetha Ramachandra Swamy Temple', 'Sri Rama Navami Utsavam 2026', 'Kovvur', 'Kovvur', 'West Godavari', 'Andhra Pradesh', 'Kovvur, West Godavari', 16.98, 81.72, 'M. Subba Rao', 'K. Srinivasa Varma', '9876543210', 'APPROVED')`,
    [defaultId]
  );
  return defaultId;
}

router.post(
  '/',
  authenticate,
  committeeRoleOrAbove,
  uploadDocument.single('bill'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const committeeId = await resolveCommitteeId(req.params.id);
      const { category, vendor, amount, description, date } = req.body;

      let billData: { s3Key: string; s3Url: string } | null = null;
      if (req.file) {
        const key = generateS3Key(S3_FOLDERS.EXPENSE_BILLS, req.file.originalname);
        billData = await uploadToS3(req.file.buffer, key, req.file.mimetype);
      }

      const expenseId = uuidv4();
      const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

      await query(
        `INSERT INTO expenses (id, committeeId, addedById, category, vendor, amount, billS3Key, billS3Url, description, date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          expenseId,
          committeeId,
          req.user!.userId,
          category || 'OTHER',
          vendor || null,
          parsedAmount || 0,
          billData?.s3Key || null,
          billData?.s3Url || null,
          description || null,
          date && !isNaN(new Date(date).getTime()) ? new Date(date) : new Date(),
        ]
      );

      const expense = await queryOne('SELECT * FROM expenses WHERE id = ?', [expenseId]);

      try {
        emitExpense(committeeId, expense);
        emitDashboardUpdate(committeeId, { type: 'expense', expense });
      } catch {}

      sendCreated(res, expense, 'Expense recorded successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

router.get(
  '/',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const committeeId = await resolveCommitteeId(req.params.id);
      const { page, limit, skip } = parsePagination(req.query);

      const expenses = await query(
        `SELECT e.*, u.name as addedByName
         FROM expenses e
         LEFT JOIN users u ON e.addedById = u.id
         WHERE e.committeeId = ?
         ORDER BY e.date DESC LIMIT ${Number(limit)} OFFSET ${Number(skip)}`,
        [committeeId]
      );

      const countRes: any = await queryOne(
        'SELECT COUNT(*) as total FROM expenses WHERE committeeId = ?',
        [committeeId]
      );

      sendSuccess(res, expenses, 'Expenses fetched', 200, buildPaginationMeta(countRes?.total || 0, page, limit));
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

export const expenseStandaloneRouter = Router();

expenseStandaloneRouter.delete(
  '/:id',
  authenticate,
  committeeRoleOrAbove,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const expense: any = await queryOne('SELECT billS3Key FROM expenses WHERE id = ?', [
        req.params.id,
      ]);
      if (!expense) {
        sendNotFound(res, 'Expense');
        return;
      }

      if (expense.billS3Key) await deleteFromS3(expense.billS3Key);
      await query('DELETE FROM expenses WHERE id = ?', [req.params.id]);

      sendSuccess(res, null, 'Expense deleted');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

export default router;
