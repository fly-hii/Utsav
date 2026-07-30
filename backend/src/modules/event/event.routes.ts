import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { committeeRoleOrAbove } from '../../middleware/roles';
import { uploadImage } from '../../middleware/upload';
import { uploadToS3, generateS3Key, S3_FOLDERS, deleteFromS3 } from '../../config/s3';
import { sendSuccess, sendCreated, sendError, sendNotFound, parsePagination, buildPaginationMeta } from '../../utils/response';
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
  uploadImage.single('banner'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const committeeId = await resolveCommitteeId(req.params.id);
      const { name, festival, description, venue, date, endDate, time, guest, budget, organizer, status, isPublic } = req.body;

      let bannerData: { s3Key: string; s3Url: string } | null = null;
      if (req.file) {
        const key = generateS3Key(S3_FOLDERS.EVENT_BANNERS, req.file.originalname);
        bannerData = await uploadToS3(req.file.buffer, key, req.file.mimetype);
      }

      const eventId = uuidv4();
      const parsedDate = date && !isNaN(new Date(date).getTime()) ? new Date(date) : new Date();
      const parsedEndDate = endDate && !isNaN(new Date(endDate).getTime()) ? new Date(endDate) : null;
      const parsedBudget = budget ? parseFloat(budget) : null;

      await query(
        `INSERT INTO events (id, committeeId, name, festival, description, banner, bannerUrl, venue, date, endDate, time, guest, budget, organizer, status, isPublic)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          eventId,
          committeeId,
          name || 'Festival Event',
          festival || null,
          description || null,
          bannerData?.s3Key || null,
          bannerData?.s3Url || null,
          venue || null,
          parsedDate,
          parsedEndDate,
          time || null,
          guest || null,
          parsedBudget,
          organizer || null,
          status || 'UPCOMING',
          isPublic !== 'false' ? 1 : 0,
        ]
      );

      const event = await queryOne('SELECT * FROM events WHERE id = ?', [eventId]);
      sendCreated(res, event, 'Event created');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

router.get(
  '/',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const committeeId = await resolveCommitteeId(req.params.id);
      const { page, limit, skip } = parsePagination(req.query);

      const events = await query(
        `SELECT * FROM events WHERE committeeId = ? ORDER BY date ASC LIMIT ${Number(limit)} OFFSET ${Number(skip)}`,
        [committeeId]
      );

      const countRes: any = await queryOne(
        'SELECT COUNT(*) as total FROM events WHERE committeeId = ?',
        [committeeId]
      );

      sendSuccess(res, events, 'Events fetched', 200, buildPaginationMeta(countRes?.total || 0, page, limit));
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

export const eventStandaloneRouter = Router();

eventStandaloneRouter.get(
  '/',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, skip } = parsePagination(req.query);

      const events = await query(
        `SELECT e.*, c.name as committeeName, c.village, c.logo, c.logoUrl
         FROM events e
         JOIN committees c ON e.committeeId = c.id
         WHERE e.isPublic = 1
         ORDER BY e.date ASC LIMIT ${Number(limit)} OFFSET ${Number(skip)}`
      );

      const countRes: any = await queryOne('SELECT COUNT(*) as total FROM events WHERE isPublic = 1');

      sendSuccess(res, events, 'Public events fetched', 200, buildPaginationMeta(countRes?.total || 0, page, limit));
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

eventStandaloneRouter.delete(
  '/:id',
  authenticate,
  committeeRoleOrAbove,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const event: any = await queryOne('SELECT banner FROM events WHERE id = ?', [req.params.id]);
      if (!event) {
        sendNotFound(res, 'Event');
        return;
      }

      if (event.banner) await deleteFromS3(event.banner);
      await query('DELETE FROM events WHERE id = ?', [req.params.id]);

      sendSuccess(res, null, 'Event deleted');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

export default router;
