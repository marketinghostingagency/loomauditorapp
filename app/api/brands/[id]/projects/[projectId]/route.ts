import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

// GET /api/brands/[id]/projects/[projectId]
// PUT /api/brands/[id]/projects/[projectId]
// DELETE /api/brands/[id]/projects/[projectId]

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  const { projectId } = await params;
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { assets: { orderBy: { createdAt: 'desc' } } },
    });
    if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(project);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  const { projectId } = await params;
  try {
    const body = await req.json();
    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        name: body.name,
        description: body.description,
        coverColor: body.coverColor,
      },
      include: { assets: true },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  const { projectId } = await params;
  try {
    await prisma.project.delete({ where: { id: projectId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
