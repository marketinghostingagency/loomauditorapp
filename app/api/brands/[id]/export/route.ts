import { NextResponse } from 'next/server';
import { storageClient, GCS_BUCKET_NAME } from '../../../../../lib/gcs';
import { prisma } from '../../../../../lib/prisma';
import archiver from 'archiver';

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const brand = await prisma.brandBook.findUnique({
       where: { id: params.id },
       include: { assets: true }
    });

    if (!brand) {
       return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const activeAssets = brand.assets.filter(a => a.status === 'ACTIVE');

    // Create a TransformStream to bridge Node.js streams to Web Streams (Next.js response)
    const { readable, writable } = new TransformStream();
    
    // Start the archiver process, piping it to our writable end
    // We use a custom writer wrapper because archiver requires a Node WritableStream
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    // Standard Node.js to WebStream bridge pattern required for NextJS App Router
    const writer = writable.getWriter();
    archive.on('data', (chunk) => writer.write(chunk));
    archive.on('end', () => writer.close());
    archive.on('error', (err) => {
       console.error('Archiver Error:', err);
       writer.abort(err);
    });

    const bucket = storageClient.bucket(GCS_BUCKET_NAME);

    // For each asset, create a read stream from GCS and pipe it straight into the archiver
    for (const asset of activeAssets) {
       const urlParts = asset.fileUrl.split('/');
       const key = urlParts[urlParts.length - 1];
       
       if (key) {
          const gcsStream = bucket.file(key).createReadStream();
          // Append stream directly to the zip file, avoiding memory buffers
          archive.append(gcsStream, { name: key });
       }
    }

    // Finalize triggers the end event once all streams are consumed
    archive.finalize();

    // Return the readable stream to the browser
    // Ensure the browser recognizes it as a file download
    const brandSlug = brand.brandName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const headers = new Headers();
    headers.append('Content-Disposition', `attachment; filename="mha-${brandSlug}-assets.zip"`);
    headers.append('Content-Type', 'application/zip');

    return new NextResponse(readable, { headers });

  } catch (error: any) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate zip export stream' }, { status: 500 });
  }
}
