import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const brandId = params.id;
    const folders = await prisma.folder.findMany({
      where: { brandId },
      include: {
        assets: {
          include: {
            asset: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(folders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const brandId = params.id;
    const { name, parentId } = await req.json();

    if (!name) return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });

    const folder = await prisma.folder.create({
      data: {
        name,
        brandId,
        parentId: parentId || null
      }
    });

    return NextResponse.json(folder);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
