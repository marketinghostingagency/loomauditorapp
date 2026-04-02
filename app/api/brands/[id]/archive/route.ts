import { NextResponse } from 'next/server';
import { CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET_NAME } from '../../../../../lib/s3';
import { prisma } from '../../../../../lib/prisma';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const brand = await prisma.brandBook.findUnique({
       where: { id: params.id },
       include: { assets: true }
    });

    if (!brand) {
       return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // For each active asset, we need to issue an S3 COPY command specifying Deep Archive, 
    // then we can technically overwrite or keep it there. AWS allows changing storage class by copying an object to itself.
    let successCount = 0;
    for (const asset of brand.assets) {
       if (asset.status === 'ARCHIVED') continue; // Skip already archived

       const urlParts = asset.fileUrl.split('/');
       const key = urlParts[urlParts.length - 1];

       if (key) {
          const copyCmd = new CopyObjectCommand({
             Bucket: S3_BUCKET_NAME,
             CopySource: `${S3_BUCKET_NAME}/${key}`,
             Key: key,
             StorageClass: 'DEEP_ARCHIVE'
          });
          
          await s3Client.send(copyCmd);
          
          // Update DB Status
          await prisma.creativeAsset.update({
             where: { id: asset.id },
             data: { status: 'ARCHIVED' }
          });
          successCount++;
       }
    }

    return NextResponse.json({ success: true, message: `Successfully transitioned ${successCount} assets to Glacier Deep Archive.` });
  } catch (error: any) {
    console.error('Archive Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to archive brand portfolio' }, { status: 500 });
  }
}
