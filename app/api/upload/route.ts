import { NextResponse } from 'next/server';
import { storageClient, GCS_BUCKET_NAME } from '../../../lib/gcs';

/**
 * Server-side direct upload to GCS.
 * The client sends the raw file as multipart/form-data.
 * We stream directly to GCS — no broken presigned URL signature issues.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const uniqueName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const bucket = storageClient.bucket(GCS_BUCKET_NAME);
    const gcsFile = bucket.file(uniqueName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await gcsFile.save(buffer, {
      contentType: file.type,
      resumable: false,
      public: true, // Make publicly readable
    });

    const publicUrl = `https://storage.googleapis.com/${GCS_BUCKET_NAME}/${uniqueName}`;
    
    return NextResponse.json({ 
      success: true,
      url: publicUrl,
      filename: uniqueName,
      size: buffer.length
    });
  } catch (error: any) {
    console.error('GCS Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file to GCS' }, { status: 500 });
  }
}
