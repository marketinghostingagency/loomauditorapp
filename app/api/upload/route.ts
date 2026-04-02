import { NextResponse } from 'next/server';
import { storageClient, GCS_BUCKET_NAME } from '../../../lib/gcs';

export async function POST(req: Request) {
  try {
    const { filename, contentType } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Filename and contentType are required' }, { status: 400 });
    }

    const uniqueName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.]/g, '_')}`;

    const bucket = storageClient.bucket(GCS_BUCKET_NAME);
    const file = bucket.file(uniqueName);

    // Generate a secure upload ticket valid for 15 minutes
    const [presignedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    });

    return NextResponse.json({ 
      presignedUrl,
      // Final reachable URL (assuming uniform bucket-level access is public read)
      url: `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${uniqueName}`
    });
  } catch (error: any) {
    console.error('Google Cloud Presigner error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate GCS upload URL' }, { status: 500 });
  }
}
