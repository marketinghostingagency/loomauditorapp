import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET_NAME } from '../../../lib/s3';

export async function POST(req: Request) {
  try {
    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Filename and contentType are required' }, { status: 400 });
    }

    const uniqueName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: uniqueName,
      ContentType: contentType,
      // ACL: 'public-read' // Uncomment if bucket is configured for public read access
    });

    // Generate a secure upload ticket valid for 5 minutes (300 seconds)
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return NextResponse.json({ 
      presignedUrl,
      // If bucket is public, this will be the final reachable URL:
      url: `https://${S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${uniqueName}`
    });
  } catch (error: any) {
    console.error('Presigner error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate upload URL' }, { status: 500 });
  }
}
