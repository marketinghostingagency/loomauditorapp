import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // We only care about eager transformation completions
    if (body.notification_type === 'eager') {
      const customContext = body.context?.custom || {};
      const { projectId, brandId, parentAssetId, assetTitle, projectTab } = customContext;
      
      const eagerArr = body.eager || [];
      
      if (!projectId || !parentAssetId) {
        console.warn('Received Cloudinary eager webhook but missing Prisma contextual IDs');
        return NextResponse.json({ success: true, warning: 'Missing context' });
      }

      // Prepare child assets insertions via mapped URL strings
      for (const generated of eagerArr) {
        // Reverse engineer the aspect ratio string from dimensions
        let aspectRatio = 'Unknown';
        const t = generated.transformation || '';
        
        if (t.includes('w_1080') && t.includes('h_1920')) aspectRatio = '9:16';
        else if (t.includes('w_1920') && t.includes('h_1080')) aspectRatio = '16:9';
        else if (t.includes('w_1080') && t.includes('h_1080')) aspectRatio = '1:1';
        else if (t.includes('w_1080') && t.includes('h_1350')) aspectRatio = '4:5';

        // Fake mapping to target audience strings based on ratio for safety scaffold
        const platforms = [];
        if (aspectRatio === '9:16') platforms.push('TikTok', 'IG Reels', 'YouTube Shorts');
        if (aspectRatio === '16:9') platforms.push('YouTube Standard');
        if (aspectRatio === '1:1') platforms.push('FB Carousel', 'IG Post');
        if (aspectRatio === '4:5') platforms.push('IG Portrait');

        await prisma.projectAsset.create({
          data: {
            title: `${assetTitle || 'Master'} [${aspectRatio}]`,
            projectId: projectId,
            assetType: projectTab || 'video',
            fileUrl: generated.secure_url,
            isMasterAsset: false,
            parentAssetId: parentAssetId,
            status: 'ACTIVE',
            aspectRatio: aspectRatio,
            platformTarget: platforms,
            videoMode: 'derivative'
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
