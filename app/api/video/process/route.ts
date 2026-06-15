import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const formatsRaw = formData.get('formats') as string;
    const contextRaw = formData.get('context') as string;
    
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const formats = formatsRaw ? JSON.parse(formatsRaw) : [];
    const contextStr = contextRaw ? JSON.parse(contextRaw) : {};
    
    // Map custom formats to Cloudinary Eager Transformations with g_auto
    const eager = formats.map((f: string) => {
        if (f === '9:16') return { width: 1080, height: 1920, crop: 'fill', gravity: 'auto' };
        if (f === '16:9') return { width: 1920, height: 1080, crop: 'fill', gravity: 'auto' };
        if (f === '1:1') return { width: 1080, height: 1080, crop: 'fill', gravity: 'auto' };
        if (f === '4:5') return { width: 1080, height: 1350, crop: 'fill', gravity: 'auto' };
        return { width: 1080, height: 1080, crop: 'fill', gravity: 'auto' };
    });

    const contextMap = Object.entries(contextStr).map(([k, v]) => `${k}=${v}`).join('|');

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new Promise((resolve) => {
      cloudinary.uploader.upload_stream(
        { 
          resource_type: 'video', 
          folder: 'loom-auditor-masters',
          eager: eager.length > 0 ? eager : undefined,
          eager_async: eager.length > 0 ? true : undefined,
          notification_url: `${process.env.NEXTAUTH_URL}/api/webhooks/cloudinary`,
          context: contextMap,
          type: "upload"
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary Video Upload Error:', error);
            resolve(NextResponse.json({ error: error.message }, { status: 500 }));
          } else {
            resolve(NextResponse.json({
              success: true,
              url: result?.secure_url,
              public_id: result?.public_id,
              status: 'processing'
            }));
          }
        }
      ).end(buffer);
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to upload to Cloudinary' }, { status: 500 });
  }
}
