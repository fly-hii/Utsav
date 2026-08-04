import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../config/database';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { committeeRoleOrAbove } from '../../middleware/roles';
import { uploadVideo } from '../../middleware/upload';
import { uploadToS3, generateS3Key, S3_FOLDERS, deleteFromS3, getPresignedUrl } from '../../config/s3';
import { sendSuccess, sendCreated, sendError, sendNotFound, sendForbidden, parsePagination, buildPaginationMeta } from '../../utils/response';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

async function resolveCommitteeId(inputCommitteeId?: string): Promise<string> {
  if (inputCommitteeId) {
    const existing: any = await queryOne('SELECT id FROM committees WHERE id = ?', [inputCommitteeId]);
    if (existing) return existing.id;
  }
  const firstComm: any = await queryOne('SELECT id FROM committees ORDER BY createdAt ASC LIMIT 1');
  if (firstComm) return firstComm.id;

  const defaultId = 'comm-default-101';
  await query(
    `INSERT INTO committees (id, name, templeName, festivalName, village, mandal, district, state, address, latitude, longitude, presidentName, secretaryName, phone, status)
     VALUES (?, 'Sri Rama Youth Committee', 'Sri Seetha Ramachandra Swamy Temple', 'Sri Rama Navami Utsavam 2026', 'Kovvur', 'Kovvur', 'West Godavari', 'Andhra Pradesh', 'Kovvur, West Godavari', 16.98, 81.72, 'M. Subba Rao', 'K. Srinivasa Varma', '9876543210', 'APPROVED')`,
    [defaultId]
  ).catch(() => {});
  return defaultId;
}

router.post(
  '/',
  authenticate,
  committeeRoleOrAbove,
  uploadVideo.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { committeeId, eventId, caption, location, hashtags, duration, videoUrl } = req.body;
      const targetCommitteeId = await resolveCommitteeId(committeeId);

      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const videoFile = files ? files['video']?.[0] : undefined;
      const thumbnailFile = files ? files['thumbnail']?.[0] : undefined;

      let videoS3Key = 'reels/default-reel.mp4';
      let videoS3Url = videoUrl || 'https://assets.mixkit.co/videos/preview/mixkit-temple-procession-festival-41586-large.mp4';

      if (videoFile) {
        const videoKey = generateS3Key(S3_FOLDERS.FESTIVAL_REELS, videoFile.originalname);
        try {
          const videoUpload = await uploadToS3(videoFile.buffer, videoKey, videoFile.mimetype);
          videoS3Key = videoUpload.s3Key;
          videoS3Url = videoUpload.s3Url;
        } catch (s3Err: any) {
          console.error('⚠️ S3 video upload error:', s3Err);
          throw new Error('S3 Video Upload Failed: ' + s3Err.message);
        }
      } else if (videoUrl && videoUrl.startsWith('http')) {
        videoS3Url = videoUrl;
      } else {
        throw new Error('No video file received by the server! Check if frontend is sending FormData correctly.');
      }

      let thumbnailS3Key: string | null = null;
      let thumbnailS3Url: string | null = null;
      if (thumbnailFile) {
        const thumbKey = generateS3Key(S3_FOLDERS.REEL_THUMBNAILS, thumbnailFile.originalname);
        try {
          const thumbnailUpload = await uploadToS3(thumbnailFile.buffer, thumbKey, thumbnailFile.mimetype);
          thumbnailS3Key = thumbnailUpload.s3Key;
          thumbnailS3Url = thumbnailUpload.s3Url;
        } catch (s3Err: any) {
          console.warn('⚠️ S3 thumbnail upload fallback:', s3Err.message);
          thumbnailS3Key = thumbKey;
          thumbnailS3Url = 'https://images.unsplash.com/photo-1609743522653-52354461eb27?w=600';
        }
      }

      const reelId = uuidv4();

      await query(
        `INSERT INTO reels (id, committeeId, eventId, uploadedById, videoS3Key, videoS3Url, thumbnailS3Key, thumbnailS3Url, caption, location, hashtags, status, duration)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?)`,
        [
          reelId,
          targetCommitteeId,
          eventId || null,
          req.user!.userId,
          videoS3Key,
          videoS3Url,
          thumbnailS3Key,
          thumbnailS3Url,
          caption || 'Festival Reel Video',
          location || 'Village Temple',
          hashtags || '#Utsav2026',
          duration ? Math.min(parseInt(duration), 300) : 300,
        ]
      );

      const reel = await queryOne('SELECT * FROM reels WHERE id = ?', [reelId]);
      
      if (reel.videoS3Key && reel.videoS3Key !== 'reels/default-reel.mp4') {
        try { reel.videoS3Url = await getPresignedUrl(reel.videoS3Key, 604800); } catch (e) {}
      }
      if (reel.thumbnailS3Key) {
        try { reel.thumbnailS3Url = await getPresignedUrl(reel.thumbnailS3Key, 604800); } catch (e) {}
      }
      
      sendCreated(res, reel, 'Reel published successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

router.get(
  '/',
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, skip } = parsePagination(req.query);
      const currentUserId = req.user?.userId || null;
      const committeeId = req.query.committeeId as string | undefined;

      let reels: any[];
      let whereClause = "r.status = 'PUBLISHED'";
      let queryParams: any[] = [];

      if (currentUserId) {
        queryParams.push(currentUserId);
      }

      if (committeeId) {
        whereClause += " AND r.committeeId = ?";
        queryParams.push(committeeId);
      }

      let queryStr = `SELECT r.*, c.name as committeeName, c.templeName, c.village, c.logo, c.logoUrl, u.name as uploaderName,
                  ${currentUserId ? 'IF(rl.id IS NOT NULL, 1, 0)' : '0'} as isLiked
           FROM reels r
           LEFT JOIN committees c ON r.committeeId = c.id
           LEFT JOIN users u ON r.uploadedById = u.id
           ${currentUserId ? 'LEFT JOIN reel_likes rl ON rl.reelId = r.id AND rl.userId = ?' : ''}
           WHERE ${whereClause}
           ORDER BY r.createdAt DESC LIMIT ${Number(limit)} OFFSET ${Number(skip)}`;

      reels = await query(queryStr, queryParams);

      let countQueryParams: any[] = [];
      let countWhereClause = "status = 'PUBLISHED'";
      if (committeeId) {
        countWhereClause += " AND committeeId = ?";
        countQueryParams.push(committeeId);
      }
      const countRes: any = await queryOne(`SELECT COUNT(*) as total FROM reels WHERE ${countWhereClause}`, countQueryParams);

      for (const reel of reels) {
        if (reel.videoS3Key && reel.videoS3Key !== 'reels/default-reel.mp4') {
          try { reel.videoS3Url = await getPresignedUrl(reel.videoS3Key, 604800); } catch (e) {}
        }
        if (reel.thumbnailS3Key) {
          try { reel.thumbnailS3Url = await getPresignedUrl(reel.thumbnailS3Key, 604800); } catch (e) {}
        }
      }

      sendSuccess(res, reels, 'Reels feed fetched', 200, buildPaginationMeta(countRes?.total || 0, page, limit));
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

router.post(
  '/:id/like',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const reelId = req.params.id;
      const userId = req.user!.userId;

      const reel: any = await queryOne('SELECT id FROM reels WHERE id = ?', [reelId]);
      if (!reel) {
        sendNotFound(res, 'Reel');
        return;
      }

      const existing: any = await queryOne(
        'SELECT id FROM reel_likes WHERE reelId = ? AND userId = ?',
        [reelId, userId]
      );

      if (existing) {
        await query('DELETE FROM reel_likes WHERE id = ?', [existing.id]);
        await query('UPDATE reels SET likeCount = GREATEST(0, likeCount - 1) WHERE id = ?', [reelId]);
        const updated: any = await queryOne('SELECT likeCount FROM reels WHERE id = ?', [reelId]);
        sendSuccess(res, { isLiked: false, likeCount: updated?.likeCount || 0 }, 'Reel unliked');
      } else {
        const likeId = uuidv4();
        await query('INSERT INTO reel_likes (id, reelId, userId) VALUES (?, ?, ?)', [
          likeId,
          reelId,
          userId,
        ]);
        await query('UPDATE reels SET likeCount = likeCount + 1 WHERE id = ?', [reelId]);
        const updated: any = await queryOne('SELECT likeCount FROM reels WHERE id = ?', [reelId]);
        sendSuccess(res, { isLiked: true, likeCount: updated?.likeCount || 0 }, 'Reel liked');
      }
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

router.get(
  '/:id/comments',
  optionalAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const reelId = req.params.id;
      const comments = await query(
        `SELECT rc.id, rc.reelId, rc.userId, rc.content, rc.createdAt, u.name as userName, u.avatar, u.avatarUrl
         FROM reel_comments rc
         LEFT JOIN users u ON rc.userId = u.id
         WHERE rc.reelId = ?
         ORDER BY rc.createdAt DESC`,
        [reelId]
      );
      sendSuccess(res, comments, 'Reel comments fetched');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

router.post(
  '/:id/comments',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const reelId = req.params.id;
      const userId = req.user!.userId;
      const { content } = req.body;

      if (!content || !content.trim()) {
        sendError(res, 'Comment text is required', 400);
        return;
      }

      const reel: any = await queryOne('SELECT id FROM reels WHERE id = ?', [reelId]);
      if (!reel) {
        sendNotFound(res, 'Reel');
        return;
      }

      const commentId = uuidv4();
      await query('INSERT INTO reel_comments (id, reelId, userId, content) VALUES (?, ?, ?, ?)', [
        commentId,
        reelId,
        userId,
        content.trim(),
      ]);
      await query('UPDATE reels SET commentCount = commentCount + 1 WHERE id = ?', [reelId]);

      const newComment: any = await queryOne(
        `SELECT rc.id, rc.reelId, rc.userId, rc.content, rc.createdAt, u.name as userName, u.avatar, u.avatarUrl
         FROM reel_comments rc
         LEFT JOIN users u ON rc.userId = u.id
         WHERE rc.id = ?`,
        [commentId]
      );

      const countRes: any = await queryOne('SELECT commentCount FROM reels WHERE id = ?', [reelId]);

      sendCreated(res, { comment: newComment, commentCount: countRes?.commentCount || 0 }, 'Comment added successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

router.put(
  '/:id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const reel: any = await queryOne('SELECT * FROM reels WHERE id = ?', [req.params.id]);
      if (!reel) {
        sendNotFound(res, 'Reel');
        return;
      }

      const { caption, hashtags, status } = req.body;
      await query(
        `UPDATE reels
         SET caption = COALESCE(?, caption),
             hashtags = COALESCE(?, hashtags),
             status = COALESCE(?, status)
         WHERE id = ?`,
        [caption || null, hashtags || null, status || null, req.params.id]
      );

      const updated = await queryOne('SELECT * FROM reels WHERE id = ?', [req.params.id]);
      sendSuccess(res, updated, 'Reel updated successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const reel: any = await queryOne(
        'SELECT id, uploadedById, committeeId, videoS3Key, thumbnailS3Key, previewS3Key FROM reels WHERE id = ?',
        [req.params.id]
      );

      if (!reel) {
        sendNotFound(res, 'Reel');
        return;
      }

      const user = req.user!;
      const isSuperAdmin = user.role === 'SUPER_ADMIN';
      const isCommitteeAdmin = user.role === 'COMMITTEE_ADMIN';
      const isUploader = user.userId === reel.uploadedById;

      if (!isSuperAdmin && !isCommitteeAdmin && !isUploader) {
        sendForbidden(res, 'You do not have permission to delete this reel');
        return;
      }

      // Clean up S3 assets if present
      if (reel.videoS3Key && reel.videoS3Key !== 'reels/default-reel.mp4') {
        await deleteFromS3(reel.videoS3Key).catch((err) => console.warn('Failed to delete reel video S3 key:', err.message));
      }
      if (reel.thumbnailS3Key) {
        await deleteFromS3(reel.thumbnailS3Key).catch((err) => console.warn('Failed to delete reel thumbnail S3 key:', err.message));
      }
      if (reel.previewS3Key) {
        await deleteFromS3(reel.previewS3Key).catch((err) => console.warn('Failed to delete reel preview S3 key:', err.message));
      }

      // Delete from database (foreign keys will CASCADE related likes/comments/shares/views)
      await query('DELETE FROM reels WHERE id = ?', [req.params.id]);

      sendSuccess(res, null, 'Reel deleted successfully');
    } catch (error: any) {
      sendError(res, error.message, error.statusCode || 500);
    }
  }
);

export default router;
