import { NextResponse } from 'next/server';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET_NAME } from '../../../../lib/s3';
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

    // Parse filename from fileUrl
    // Assuming url is like: https://mha-creative-studio.s3.us-east-1.amazonaws.com/169000-video.mp4
    const urlParts = asset.fileUrl.split('/');
    const key = urlParts[urlParts.length - 1];

    if (key) {
       // Issue delete command to AWS
       const command = new DeleteObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: key
       });
       await s3Client.send(command).catch(err => console.error('AWS Delete Error:', err));
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
