import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';

export const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

export const S3_FOLDERS = {
  COMMITTEE_LOGOS: 'committee-logos',
  COMMITTEE_DOCUMENTS: 'committee-documents',
  TEMPLE_IMAGES: 'temple-images',
  MEMBER_PROFILES: 'member-profiles',
  EVENT_BANNERS: 'event-banners',
  FESTIVAL_REELS: 'festival-reels',
  REEL_THUMBNAILS: 'reel-thumbnails',
  GALLERY: 'gallery',
  EXPENSE_BILLS: 'expense-bills',
  DONATION_RECEIPTS: 'donation-receipts',
} as const;

/**
 * Upload a file buffer to S3
 */
export async function uploadToS3(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<{ s3Key: string; s3Url: string }> {
  const command = new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  const s3Url = `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  return { s3Key: key, s3Url };
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
  });
  await s3Client.send(command);
}

/**
 * Generate a pre-signed URL for temporary access
 */
export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a unique S3 key for a file
 */
export function generateS3Key(folder: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${folder}/${timestamp}_${sanitizedName}`;
}
