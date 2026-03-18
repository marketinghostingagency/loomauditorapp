import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

    if (!HEYGEN_API_KEY) {
      return NextResponse.json({ error: 'HeyGen configuration is missing' }, { status: 500 });
    }

    const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
      headers: {
        'Accept': 'application/json',
        'X-Api-Key': HEYGEN_API_KEY
      }
    });

    const data = await response.json();

    if (!response.ok || data.code !== 100) {
      throw new Error(data.message || 'Failed to get HeyGen video status');
    }

    return NextResponse.json(data.data);
  } catch (error: any) {
    console.error('HeyGen Status Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
