import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../../../../lib/prisma';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get('assetId');
    if (!assetId) return NextResponse.json({ error: 'assetId required' }, { status: 400 });

    const masterAsset = await prisma.projectAsset.findUnique({
        where: { id: assetId },
        include: { childAssets: true }
    });

    if (!masterAsset) return NextResponse.json({ error: 'Master Asset not found' }, { status: 404 });

    let specs = null;
    try { specs = masterAsset.specs ? JSON.parse(masterAsset.specs) : null; } catch (e) {}

    const publicId = specs?.cloudinaryPublicId;
    if (!publicId) return NextResponse.json({ error: 'Missing Cloudinary Public ID on this asset. Was it uploaded via Omni-Master Mode?' }, { status: 400 });

    // Explicitly query Cloudinary for the detailed generation profile
    const details = await cloudinary.api.resource(publicId);

    const eagerArr = details.eager || [];
    let addedCount = 0;

    for (const generated of eagerArr) {
      let aspectRatio = 'Unknown';
      const t = generated.transformation || '';
      
      if (t.includes('w_1080') && t.includes('h_1920')) aspectRatio = '9:16';
      else if (t.includes('w_1920') && t.includes('h_1080')) aspectRatio = '16:9';
      else if (t.includes('w_1080') && t.includes('h_1080')) aspectRatio = '1:1';
      else if (t.includes('w_1080') && t.includes('h_1350')) aspectRatio = '4:5';

      // Avoid duplication if the webhook caught it or if already polled
      const exists = masterAsset.childAssets.find(c => c.aspectRatio === aspectRatio);
      if (exists) continue;

      const platforms = [];
      if (aspectRatio === '9:16') platforms.push('TikTok', 'IG Reels', 'YouTube Shorts');
      if (aspectRatio === '16:9') platforms.push('YouTube Standard');
      if (aspectRatio === '1:1') platforms.push('FB Carousel', 'IG Post');
      if (aspectRatio === '4:5') platforms.push('IG Portrait');

      await prisma.projectAsset.create({
        data: {
          title: `${masterAsset.title} [${aspectRatio}]`,
          projectId: masterAsset.projectId,
          assetType: masterAsset.assetType,
          fileUrl: generated.secure_url,
          isMasterAsset: false,
          parentAssetId: masterAsset.id,
          status: 'ACTIVE',
          aspectRatio: aspectRatio,
          platformTarget: platforms,
          videoMode: 'derivative'
        }
      });
      addedCount++;
    }

    // Refresh context payload for UI sync
    const finalMaster = await prisma.projectAsset.findUnique({
        where: { id: assetId }
    });

    const activeChildren = await prisma.projectAsset.findMany({
        where: { parentAssetId: assetId }
    });

    return NextResponse.json({ success: true, addedCount, refreshedChildren: activeChildren });

  } catch (error: any) {
    console.error('Cloudinary Poll Error:', error);
    return NextResponse.json({ error: error.message || 'Server error tracking Cloudinary status' }, { status: 500 });
  }
}
