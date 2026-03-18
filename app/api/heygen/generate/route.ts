import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { script, url } = await req.json();

    if (!script) {
      return NextResponse.json({ error: 'Script text is required' }, { status: 400 });
    }

    const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
    const AVATAR_ID = process.env.HEYGEN_AVATAR_ID;
    const VOICE_ID = process.env.HEYGEN_VOICE_ID;

    if (!HEYGEN_API_KEY || !AVATAR_ID) {
      return NextResponse.json({ error: 'HeyGen configuration is missing' }, { status: 500 });
    }

    // Generate a high-res screenshot to serve as the "Loom Website Background"
    let backgroundObj = undefined;
    if (url) {
      try {
        const mlRes = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=false`);
        const mlData = await mlRes.json();
        if (mlData?.data?.screenshot?.url) {
          backgroundObj = {
            type: "image",
            url: mlData.data.screenshot.url
          };
        }
      } catch (err) {
        console.warn("Failed to generate Microlink screenshot, proceeding with default background.", err);
      }
    }

    const payload: any = {
      video_inputs: [
        {
          character: {
            type: "avatar",
            avatar_id: AVATAR_ID,
            avatar_style: "normal",
            scale: 0.3, // Shrink avatar to act like a Loom Bubble
            position: { x: -0.3, y: -0.3 } // Move it to the bottom-left corner
          },
          voice: {
            type: "text",
            input_text: script,
            voice_id: VOICE_ID || "d102af5d6c144a9a9926394a05d527ee"
          }
        }
      ],
      test: false
    };

    // Attach the website screenshot to the background if successfully generated
    if (backgroundObj) {
      payload.video_inputs[0].background = backgroundObj;
    }

    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Api-Key': HEYGEN_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || 'Failed to generate HeyGen video');
    }

    return NextResponse.json({ videoId: data.data.video_id });
  } catch (error: any) {
    console.error('HeyGen Generate Error:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
