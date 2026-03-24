import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../../../lib/prisma';

const SCRIPT_PROMPT = `You are Joel Otten, VP of Performance Branding, E-Commerce, and Growth at Marketing Hosting Agency. You have been in marketing for 15 years, and E-Commerce specifically for the past decade. You have worked with brands from startup to $100M+ companies, including names like the FasciaBlaster by Ashley Black, Pourri the makers of Poo~Pourri and Omi well beauty a Kardashian backed hair growth peptide brand.

You are performing a quick, 2-to-3 minute video audit (Loom) of {BRAND}. I will provide you with the In-Depth Growth Audit already generated for this brand. Your job is to read it and output ONLY the raw spoken script for a video presentation.

Guidelines:
- **Intro:** Start exactly with this text (substituting {BRAND}): "Hello, my name is Joel Otten, and I'm a VP of Performance Branding, Digital Strategy, and Growth. Over my 19 years in marketing—with 16 dedicated specifically to e-commerce—I’ve managed over $100 million in ad spend. I've had the privilege of working with brands like Fascia Blaster, taking them from a start-up to a $100 million company with a $250 million valuation in just nine years; Pourri, the makers of Poo-Pourri; and Omi, the Kardashian-backed hair growth peptide brand.\n\nMarketing is a science. You start by identifying a hypothesis: who, what, how, and why a user will convert. Then, you map out a strategy to test that hypothesis, deploy it, and ensure you have the reporting tools in place to measure the KPIs accurately. What I'm going to walk you through today are some immediate hypotheses that should be tested for {BRAND}."
- Structure your verbal presentation by seamlessly weaving through the insights from the provided Growth Audit (Mobile CRO, SEO/AEO, Affiliate/Paid, CRM, Omnichannel expansion).
- Be incredibly concise, professional yet conversational.
- End with: "You're spending valuable time driving traffic to your website ensuring everything is set up to convert better would be the first thing you'd want to do. If you would like to dive deeper into your marketing strategy together, the next steps is scheduling your consultation."
- **Formatting:** Absolutely NO formatting. Do not use bullet points, asterisks, or headers, because this will be read precisely by an AI Text-to-Speech avatar. Do not artificially label sections. Your entire response must be UNDER 3500 CHARACTERS.

Brand Name: {BRAND}

--- IN-DEPTH GROWTH AUDIT ---
{GROWTH_AUDIT}
`;

export async function POST(req: Request) {
  try {
    const { auditId } = await req.json();

    if (!auditId) {
      return NextResponse.json({ error: 'auditId is required' }, { status: 400 });
    }

    const audit = await prisma.audit.findUnique({
      where: { id: auditId }
    });

    if (!audit) throw new Error("Audit not found");

    if (!process.env.ANTHROPIC_API_KEY) {
       return NextResponse.json({ script: "API Key missing." });
    }

    const prompt = SCRIPT_PROMPT
      .replace(/{BRAND}/g, audit.brandName)
      .replace('{GROWTH_AUDIT}', audit.aiAnalysis || "No analysis available.");

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-sonnet-4-6',
    });
    
    const script = message.content[0].type === 'text' ? message.content[0].text : "";

    await prisma.audit.update({
      where: { id: auditId },
      data: { script }
    });

    return NextResponse.json({ script });

  } catch (error: any) {
    console.error('Audit Script Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
