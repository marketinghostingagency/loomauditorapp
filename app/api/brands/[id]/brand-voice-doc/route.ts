import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { Storage } from '@google-cloud/storage';

// POST /api/brands/[id]/brand-voice-doc
// Accepts multipart form with a 'file' field (PDF, DOCX, PPTX)
// Uploads to GCS and updates brandVoiceDocUrl on BrandBook

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const BUCKET = process.env.GCS_BUCKET_NAME || 'mha-creative-studio';
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/vnd.ms-powerpoint', // ppt
  'text/plain',
];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const brand = await prisma.brandBook.findUnique({ where: { id } });
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File must be a PDF, Word doc, PowerPoint, or text file' },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() || 'pdf';
    const fileName = `brands/${id}/voice-doc-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const bucket = storage.bucket(BUCKET);
    const gcsFile = bucket.file(fileName);
    await gcsFile.save(buffer, {
      metadata: { contentType: file.type },
      resumable: false,
    });
    await gcsFile.makePublic();

    const publicUrl = `https://storage.googleapis.com/${BUCKET}/${fileName}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma.brandBook.update as any)({
      where: { id },
      data: { brandVoiceDocUrl: publicUrl },
    });

    return NextResponse.json({ url: publicUrl, brand: updated });
  } catch (e: any) {
    console.error('Brand voice doc upload error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma.brandBook.update as any)({
      where: { id },
      data: { brandVoiceDocUrl: null },
    });
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
