import { s3Client } from './src/config/s3';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from './src/config/env';

async function testS3Write() {
  try {
    console.log('Testing S3 Write to', env.AWS_S3_BUCKET, '...');
    const command = new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: 'test-upload/hello.txt',
      Body: Buffer.from('Hello S3'),
      ContentType: 'text/plain',
    });
    await s3Client.send(command);
    console.log('S3 Write Successful!');
    
    // clean up
    await s3Client.send(new DeleteObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: 'test-upload/hello.txt',
    }));
    console.log('S3 Delete Successful!');
  } catch (error: any) {
    console.error('S3 Write Failed!');
    console.error('Error Code:', error.name || error.code);
    console.error('Error Message:', error.message);
  }
}

testS3Write();
