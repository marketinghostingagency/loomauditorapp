import { NextResponse } from 'next/server';
import { storageClient, GCS_BUCKET_NAME } from '../../../../../lib/gcs';
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

    let successCount = 0;
    const bucket = storageClient.bucket(GCS_BUCKET_NAME);

    for (const asset of brand.assets) {
       if (asset.status !== 'ARCHIVED') continue; 
       const urlParts = asset.fileUrl.split('/');
       const key = urlParts[urlParts.length - 1];

       if (key && !key.includes('pending')) {
          const file = bucket.file(key);
          await file.setStorageClass('STANDARD'); // Revert back to Standard storage class
          
          await prisma.creativeAsset.update({
             where: { id: asset.id },
             data: { status: 'ACTIVE' }
          });
          successCount++;
       }
    }

    await prisma.brandBook.update({
       where: { id: params.id },
       data: { status: 'ACTIVE' }
    });

    return NextResponse.json({ success: true, message: `Successfully unarchived brand portfolio and restored ${successCount} assets to active Standard storage.` });
  } catch (error: any) {
    console.error('Unarchive Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to unarchive brand portfolio' }, { status: 500 });
  }
}
