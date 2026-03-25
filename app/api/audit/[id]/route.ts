import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    
    await prisma.audit.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Audit deleted successfully' });
  } catch (error: any) {
    console.error('Failed to delete audit:', error);
    return NextResponse.json({ error: 'Failed to delete audit record from the database' }, { status: 500 });
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const { aiAnalysis } = await req.json();

    if (!aiAnalysis) {
      return NextResponse.json({ error: 'aiAnalysis payload is required' }, { status: 400 });
    }

    const updatedAudit = await prisma.audit.update({
      where: { id },
      data: { aiAnalysis: JSON.stringify(aiAnalysis) }
    });

    return NextResponse.json({ success: true, audit: updatedAudit });
  } catch (error: any) {
    console.error('Failed to update audit:', error);
    return NextResponse.json({ error: 'Failed to update audit record' }, { status: 500 });
  }
}
