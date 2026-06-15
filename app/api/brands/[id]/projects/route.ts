import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

// GET /api/brands/[id]/projects  — list all projects for a brand
// POST /api/brands/[id]/projects — create a new project

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: brandId } = await params;
  try {
    const projects = await prisma.project.findMany({
      where: { brandId },
      include: { assets: true },
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(projects);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: brandId } = await params;
  try {
    const { name, description, coverColor } = await req.json();
    if (!name) return NextResponse.json({ error: 'Project name required' }, { status: 400 });

    const project = await prisma.project.create({
      data: { brandId, name, description, coverColor },
      include: { assets: true },
    });
    return NextResponse.json(project);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
