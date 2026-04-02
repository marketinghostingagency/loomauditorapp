import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const brandId = params.id;
    const body = await req.json();
    const { title, type, fileUrl, classification, isPrimary, tags, dimensions, platform, status } = body;

    if (!fileUrl || !title) {
      return NextResponse.json({ error: 'fileUrl and title are required' }, { status: 400 });
    }

    const asset = await prisma.creativeAsset.create({
      data: {
        brandId,
        title,
        type: type || 'image',
        fileUrl,
        classification,
        isPrimary: isPrimary === true,
        tags: tags ? JSON.stringify(tags) : null,
        dimensions,
        platform,
        status: status || 'ACTIVE'
      }
    });

    return NextResponse.json({ success: true, asset });
  } catch (error: any) {
    console.error('Failed to save asset to DB:', error);
    return NextResponse.json({ error: error.message || 'Failed to save asset' }, { status: 500 });
  }
}
