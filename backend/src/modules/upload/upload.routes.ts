import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { uploadMixed } from '../../middleware/upload';
import { uploadToS3, generateS3Key, deleteFromS3, S3_FOLDERS } from '../../config/s3';
import { sendCreated, sendSuccess, sendError } from '../../utils/response';

const router = Router();

/**
 * POST /api/upload - Generic S3 file upload
 */
router.post(
  '/',
  authenticate,
  uploadMixed.single('file'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        sendError(res, 'No file uploaded', 400);
        return;
      }

      const folder = req.body.folder || S3_FOLDERS.GALLERY;
      const key = generateS3Key(folder, req.file.originalname);
      const uploaded = await uploadToS3(req.file.buffer, key, req.file.mimetype);

      sendCreated(res, uploaded, 'File uploaded to S3 successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

/**
 * DELETE /api/upload - Delete file from S3 by key
 */
router.delete(
  '/',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { key } = req.body;
      if (!key) {
        sendError(res, 'S3 key is required', 400);
        return;
      }

      await deleteFromS3(key);
      sendSuccess(res, null, 'File deleted from S3');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

export default router;
