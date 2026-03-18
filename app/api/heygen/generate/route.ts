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

    // HeyGen has a strict 5000 character limit per input, regardless of plan limits. 
    // We must mathematically shard the script into sequential scenes to prevent API rejection.
    const MAX_CHUNK_SIZE = 4500;
    const chunks: string[] = [];
    let remaining = script.trim();
    
    while (remaining.length > 0) {
      if (remaining.length <= MAX_CHUNK_SIZE) {
        chunks.push(remaining);
        break;
      }
      
      // Find the last natural punctuation break within the character limit to avoid cutting off words
      let breakPoint = remaining.lastIndexOf('. ', MAX_CHUNK_SIZE);
      if (breakPoint === -1) breakPoint = remaining.lastIndexOf('? ', MAX_CHUNK_SIZE);
      if (breakPoint === -1) breakPoint = remaining.lastIndexOf('! ', MAX_CHUNK_SIZE);
      if (breakPoint === -1) breakPoint = remaining.lastIndexOf('\n', MAX_CHUNK_SIZE);
      
      // If no natural sentence break exists (e.g. impossible monolithic block), force a hard cut
      if (breakPoint === -1 || breakPoint === 0) {
        breakPoint = MAX_CHUNK_SIZE;
      } else {
        breakPoint += 1; // Include the punctuation mark in the chunk
      }
      
      chunks.push(remaining.substring(0, breakPoint).trim());
      remaining = remaining.substring(breakPoint).trim();
    }

    const video_inputs = chunks.filter(c => c.trim().length > 0).map(chunk => {
      const input: any = {
        character: {
          type: "avatar",
          avatar_id: AVATAR_ID,
          avatar_style: "normal",
          scale: 0.3, // Shrink avatar to act like a Loom Bubble
          position: { x: -0.3, y: -0.3 } // Move it to the bottom-left corner
        },
        voice: {
          type: "text",
          input_text: chunk.trim(),
          voice_id: VOICE_ID || "d102af5d6c144a9a9926394a05d527ee"
        }
      };
      
      if (backgroundObj) {
        input.background = backgroundObj;
      }
      return input;
    });

    const payload: any = {
      video_inputs: video_inputs,
      test: false
    };

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
