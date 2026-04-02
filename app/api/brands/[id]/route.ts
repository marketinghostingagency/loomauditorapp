import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { storageClient, GCS_BUCKET_NAME } from '../../../../lib/gcs';

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();

    // Only allow safe fields to be updated
    const allowed = [
      // 4 clean brand tokens
      'brandBackground', 'brandHeaderColor', 'brandTextColor', 'brandCtaColor',
      // Legacy
      'primaryColor', 'secondaryColor', 'accentColor', 'backgroundColor',
      'fontColor', 'ctaPrimaryColor', 'ctaSecondaryColor',
      'typography', 'fontH1', 'fontH2', 'fontBody',
      'logoUrl', 'toneOfVoice', 'website', 'brandName'
    ];
    const data: Record<string, string> = {};
    for (const key of allowed) {
      if (key in body) data[key] = body[key];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma.brandBook.update as any)({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Brand PATCH Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update brand' }, { status: 500 });
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;

    const brand = await prisma.brandBook.findUnique({
      where: { id: params.id },
      include: { assets: true }
    });

    if (!brand) throw new Error("Brand not found");

    const bucket = storageClient.bucket(GCS_BUCKET_NAME);

    // Completely scrub physical files from Google Cloud Storage
    for (const asset of brand.assets) {
       const urlParts = asset.fileUrl.split('/');
       const key = urlParts[urlParts.length - 1];
       if (key) {
           const file = bucket.file(key);
           const [exists] = await file.exists();
           if (exists) {
               await file.delete();
           }
       }
    }
    
    // Deleting the BrandBook will cascade and delete all CreativeAssets natively in SQLite due to onDelete: Cascade
    await prisma.brandBook.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true, message: 'Portfolio AND GCS Files successfully deleted.' });
  } catch (error: any) {
    console.error('Delete Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete portfolio' }, { status: 500 });
  }
}
