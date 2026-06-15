import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../../lib/prisma';

// GET /api/brands/[id]/projects/[projectId]/assets
// POST /api/brands/[id]/projects/[projectId]/assets

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  const { projectId } = await params;
  try {
    const assets = await prisma.projectAsset.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(assets);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  const { projectId } = await params;
  try {
    const body = await req.json();
    const {
      title, assetType, platform, videoMode, aiPrompt, specs,
      imageMode, youtubeUrl, linkedImageIds, fileUrl, thumbnailUrl,
      status, notes,
    } = body;

    if (!title || !assetType) {
      return NextResponse.json({ error: 'title and assetType required' }, { status: 400 });
    }

    const asset = await prisma.projectAsset.create({
      data: {
        projectId,
        title,
        assetType,
        platform: platform ?? null,
        videoMode: videoMode ?? null,
        aiPrompt: aiPrompt ?? null,
        specs: specs ? JSON.stringify(specs) : null,
        imageMode: imageMode ?? null,
        youtubeUrl: youtubeUrl ?? null,
        linkedImageIds: linkedImageIds ? JSON.stringify(linkedImageIds) : null,
        fileUrl: fileUrl ?? null,
        thumbnailUrl: thumbnailUrl ?? null,
        status: status ?? 'DRAFT',
        notes: notes ?? null,
      },
    });

    // Update the project's updatedAt
    await prisma.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(asset);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  const { projectId } = await params;
  try {
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get('assetId');
    if (!assetId) return NextResponse.json({ error: 'assetId required' }, { status: 400 });

    await prisma.projectAsset.delete({ where: { id: assetId, projectId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
