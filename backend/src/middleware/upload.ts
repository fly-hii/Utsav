import multer from 'multer';
import path from 'path';

// File size limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB (supports up to 5 minute 4K/HD video reels)
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20 MB

// Allowed file types
const IMAGE_TYPES = /jpeg|jpg|png|gif|webp/;
const VIDEO_TYPES = /mp4|mov|avi|webm|mkv/;
const DOCUMENT_TYPES = /pdf|doc|docx|jpg|jpeg|png/;

/**
 * Create multer upload middleware with memory storage (for S3 upload)
 */
function createUpload(maxSize: number, allowedTypes: RegExp) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize },
    fileFilter: (_req, file, cb) => {
      // Allow all formats to be uploaded
      cb(null, true);
    },
  });
}

// Pre-configured upload middlewares
export const uploadImage = createUpload(MAX_IMAGE_SIZE, IMAGE_TYPES);
export const uploadVideo = createUpload(MAX_VIDEO_SIZE, VIDEO_TYPES);
export const uploadDocument = createUpload(MAX_DOCUMENT_SIZE, DOCUMENT_TYPES);

// Mixed upload for committee registration (images + documents)
export const uploadMixed = createUpload(
  MAX_DOCUMENT_SIZE,
  /jpeg|jpg|png|gif|webp|pdf|doc|docx/
);

// Generic single file upload middleware (using 'file' field)
export const uploadSingle = uploadImage.single('file');
