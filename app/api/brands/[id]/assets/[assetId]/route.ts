import { NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';

export async function PUT(req: Request, props: { params: Promise<{ id: string, assetId: string }> }) {
  try {
    const params = await props.params;
    const body = await req.json();
    
    // We only explicitly allow status updates currently for Finalize functionality.
    if (!body.status) {
       return NextResponse.json({ error: 'Status payload is required' }, { status: 400 });
    }

    const asset = await prisma.creativeAsset.update({
      where: { 
         id: params.assetId,
         brandId: params.id // Ensure security boundary
      },
      data: {
         status: body.status
      }
    });

    return NextResponse.json({ success: true, asset });
  } catch (error: any) {
    console.error('Update Asset Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update asset' }, { status: 500 });
  }
}
