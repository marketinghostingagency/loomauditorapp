import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { assetId, folderId } = await req.json();
    if (!assetId || !folderId) return NextResponse.json({ error: 'assetId and folderId are required' }, { status: 400 });

    const shortcut = await prisma.creativeAssetFolder.create({
      data: {
        assetId,
        folderId
      }
    });

    return NextResponse.json({ success: true, shortcut });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { assetId, folderId } = await req.json();
    if (!assetId || !folderId) return NextResponse.json({ error: 'assetId and folderId are required' }, { status: 400 });

    await prisma.creativeAssetFolder.delete({
      where: {
        assetId_folderId: {
          assetId,
          folderId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
