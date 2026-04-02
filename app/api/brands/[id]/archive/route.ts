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
       if (asset.status === 'ARCHIVED') continue; 

       const urlParts = asset.fileUrl.split('/');
       const key = urlParts[urlParts.length - 1];

       if (key) {
          const file = bucket.file(key);
          // GCS supports directly setting storage class to ARCHIVE without a copy copy trick
          await file.setStorageClass('ARCHIVE');
          
          await prisma.creativeAsset.update({
             where: { id: asset.id },
             data: { status: 'ARCHIVED' }
          });
          successCount++;
       }
    }

    return NextResponse.json({ success: true, message: `Successfully transitioned ${successCount} assets to Google Cloud Archive Storage ($0.0012/GB).` });
  } catch (error: any) {
    console.error('Archive Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to archive brand portfolio' }, { status: 500 });
  }
}
