import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { committeeRoleOrAbove } from '../../middleware/roles';
import { uploadImage } from '../../middleware/upload';
import { uploadToS3, generateS3Key, S3_FOLDERS, deleteFromS3 } from '../../config/s3';
import { sendSuccess, sendCreated, sendError, sendNotFound, parsePagination, buildPaginationMeta } from '../../utils/response';
import { v4 as uuidv4 } from 'uuid';

const router = Router({ mergeParams: true });

router.post(
  '/',
  authenticate,
  committeeRoleOrAbove,
  uploadImage.array('images', 10),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const committeeId = req.params.id;
      const { eventId, caption } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        sendError(res, 'At least one image is required', 400);
        return;
      }

      const createdImages = [];

      for (const file of files) {
        const id = uuidv4();
        const key = generateS3Key(S3_FOLDERS.GALLERY, file.originalname);
        const uploaded = await uploadToS3(file.buffer, key, file.mimetype);

        await query(
          `INSERT INTO gallery (id, committeeId, eventId, uploadedById, imageS3Key, imageS3Url, caption)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, committeeId, eventId || null, req.user!.userId, uploaded.s3Key, uploaded.s3Url, caption || null]
        );

        createdImages.push({ id, s3Key: uploaded.s3Key, s3Url: uploaded.s3Url });
      }

      sendCreated(res, createdImages, `${createdImages.length} image(s) uploaded`);
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

router.get(
  '/',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const committeeId = req.params.id;
      const { page, limit, skip } = parsePagination(req.query);

      const images = await query(
        `SELECT * FROM gallery WHERE committeeId = ? ORDER BY createdAt DESC LIMIT ${Number(limit)} OFFSET ${Number(skip)}`,
        [committeeId]
      );

      const countRes: any = await queryOne('SELECT COUNT(*) as total FROM gallery WHERE committeeId = ?', [committeeId]);

      sendSuccess(res, images, 'Gallery fetched', 200, buildPaginationMeta(countRes?.total || 0, page, limit));
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

export const galleryStandaloneRouter = Router();

galleryStandaloneRouter.delete(
  '/:id',
  authenticate,
  committeeRoleOrAbove,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const img: any = await queryOne('SELECT imageS3Key FROM gallery WHERE id = ?', [req.params.id]);
      if (!img) {
        sendNotFound(res, 'Gallery image');
        return;
      }

      await deleteFromS3(img.imageS3Key);
      await query('DELETE FROM gallery WHERE id = ?', [req.params.id]);

      sendSuccess(res, null, 'Image deleted');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

export default router;
