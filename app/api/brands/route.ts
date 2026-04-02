import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(req: Request) {
  try {
    const { brandName } = await req.json();

    if (!brandName) {
       return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    const newBrand = await prisma.brandBook.create({
       data: {
          brandName
       }
    });

    return NextResponse.json(newBrand);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create brand.' }, { status: 500 });
  }
}
