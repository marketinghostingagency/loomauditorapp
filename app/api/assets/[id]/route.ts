import { NextResponse } from 'next/server';
import { storageClient, GCS_BUCKET_NAME } from '../../../../lib/gcs';
import { prisma } from '../../../../lib/prisma';

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const asset = await prisma.creativeAsset.findUnique({
       where: { id: params.id }
    });

    if (!asset) {
       return NextResponse.json({ error: 'Asset not found in database' }, { status: 404 });
    }

    const urlParts = asset.fileUrl.split('/');
    const key = urlParts[urlParts.length - 1];

    if (key) {
       // Issue delete command to Google Cloud Storage
       const bucket = storageClient.bucket(GCS_BUCKET_NAME);
       const file = bucket.file(key);
       await file.delete().catch(err => console.error('GCS Delete Error:', err));
    }

    // Delete from Database
    await prisma.creativeAsset.delete({
       where: { id: params.id }
    });

    return NextResponse.json({ success: true, message: 'Asset deleted entirely.' });
  } catch (error: any) {
    console.error('Delete API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete asset' }, { status: 500 });
  }
}
