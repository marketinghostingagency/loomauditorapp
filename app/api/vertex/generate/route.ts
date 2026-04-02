import { NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';

const vertexAI = new VertexAI({
  project: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
  location: 'us-central1' // Typical default location for Vertex models
});

// We interface with gemini-default / multimodal or Veo specifically depending on access.
// For now we use the latest gemini multimodal capable of video tasks, or you can swap to 'veo-1.0'
const generativeModel = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-pro-preview-0409',
});

export async function POST(req: Request) {
  try {
    const { fileUrl, prompt, aspectPreset } = await req.json();

    if (!fileUrl || !prompt) {
      return NextResponse.json({ error: 'fileUrl and prompt are required' }, { status: 400 });
    }

    // Map the requested preset to instructions for the AI
    let safeZoneInstructions = "Ensure the top 14% (250px) and bottom 20% (340px) are left entirely free from generated text, hard logos, or call-to-actions.";
    let formatInstructions = "";

    switch(aspectPreset) {
       case '1:1':
          formatInstructions = "Output must be exactly 1440x1440 pixels (1:1 ratio).";
          break;
       case '4:5':
          formatInstructions = "Output must be exactly 1440x1800 pixels (4:5 ratio).";
          break;
       case '9:16':
          formatInstructions = "Output must be exactly 1440x2560 pixels (9:16 ratio) for Stories.";
          break;
       default:
          formatInstructions = "Match original video aspect ratio.";
    }

    const fullPrompt = `
      You are the MHA Creative Studio engine (powered by VEO). Analyze the attached video and duplicate it with the following core changes:
      [USER REQUEST]: ${prompt}

      [META ADS SPECIFICATIONS - MANDATORY]:
      ${formatInstructions}
      ${safeZoneInstructions}
      File size objective: under 4GB.
    `;

    // Convert public URL to internal gs:// format required by Vertex AI natively if it's hosted on GCS
    // Assuming standard URL format https://storage.googleapis.com/bucket/key
    let gcsUri = fileUrl;
    if (fileUrl.includes('storage.googleapis.com')) {
        const urlParts = fileUrl.split('storage.googleapis.com/');
        gcsUri = `gs://${urlParts[1]}`;
    }

    const request = {
      contents: [
        { role: 'user', parts: [{ fileData: { fileUri: gcsUri, mimeType: 'video/mp4' } }, { text: fullPrompt }] }
      ],
    };

    // Mocking response logic here if Veo / Gemini Pro is doing async rendering vs direct streaming.
    const streamingResp = await generativeModel.generateContentStream(request);
    let finalResponse = '';
    for await (const item of streamingResp.stream) {
        // Typically a video gen endpoint would return an async Job ID or a direct storage URI.
        // Assuming text response with job metadata for now depending on exact VEO implementation payload.
        finalResponse += item.candidates?.[0]?.content.parts?.[0]?.text || '';
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Vertex Generation Job Submitted Successfully',
      analysisPayload: finalResponse
    });
  } catch (error: any) {
    console.error('Vertex Gen Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit AI Generation job' }, { status: 500 });
  }
}
