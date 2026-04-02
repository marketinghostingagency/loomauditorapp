import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const { theme } = await req.json();

    if (!theme || (theme !== 'mha' && theme !== 'simplicity')) {
       return NextResponse.json({ error: 'Valid theme (mha or simplicity) is required' }, { status: 400 });
    }

    const audit = await prisma.audit.findUnique({
      where: { id }
    });

    if (!audit) {
       return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    await prisma.audit.update({
      where: { id },
      data: {
        sentAt: new Date(),
        sentTheme: theme
      }
    });

    return NextResponse.json({ success: true, message: `Audit marked as manually sent via ${theme.toUpperCase()}` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to mark as sent.' }, { status: 500 });
  }
}
