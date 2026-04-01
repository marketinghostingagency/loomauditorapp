import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import nodemailer from 'nodemailer';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const { theme } = await req.json();

    if (!theme || (theme !== 'mha' && theme !== 'simplicity')) {
       return NextResponse.json({ error: 'Valid theme (mha or simplicity) is required' }, { status: 400 });
    }

    const audit = await prisma.audit.findUnique({
      where: { id },
      select: { brandName: true }
    });

    if (!audit) {
       return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    }

    const lead = await prisma.lead.findFirst({
       where: { auditId: id },
       orderBy: { createdAt: 'desc' }
    });

    if (!lead || !lead.email) {
       return NextResponse.json({ error: 'No Lead email associated with this Audit' }, { status: 400 });
    }

    let transporter;
    let mailOptions;
    
    // We will attempt to fall back to the master SMTP configuration if the simplicity one fails to exist, assuming Joel maps them to the same account for now.
    const smtpUser = theme === 'simplicity' && process.env.SMTP_USER_SIMPLICITY ? process.env.SMTP_USER_SIMPLICITY : process.env.SMTP_USER;
    const smtpPass = theme === 'simplicity' && process.env.SMTP_PASSWORD_SIMPLICITY ? process.env.SMTP_PASSWORD_SIMPLICITY : process.env.SMTP_PASSWORD;

    if (!smtpUser || !smtpPass) {
       return NextResponse.json({ error: 'SMTP credentials not configured on the server.' }, { status: 500 });
    }

    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: smtpUser,
            pass: smtpPass
        }
    });

    const reportUrl = `https://audit.marketinghosting.agency/report/${id}?theme=${theme}`;

    if (theme === 'mha') {
       mailOptions = {
          from: '"Joel Otten" <joel@marketinghosting.agency>',
          to: lead.email,
          subject: `Your In-Depth Growth Audit for ${audit.brandName} is Ready`,
          html: `
              <p>Joel has completed his master-level teardown of your digital footprint for <strong>${audit.brandName}</strong>.</p>
              <p>You can securely access your executive hypothesis report and strategic playbook below:</p>
              <p><a href="${reportUrl}">${reportUrl}</a></p>
              <p>Please review these findings, and let me know when you'd like to schedule a call to discuss the path forward.</p>
          `
       };
    } else {
       mailOptions = {
          from: '"Joel Otten" <jotten@simplicitymedia.com>',
          to: lead.email,
          subject: `Your In-Depth Growth Audit for ${audit.brandName} is Ready`,
          html: `
              <p>Joel has completed his master-level teardown of your digital footprint for <strong>${audit.brandName}</strong>.</p>
              <p>You can securely access your executive hypothesis report and strategic playbook below:</p>
              <p><a href="${reportUrl}">${reportUrl}</a></p>
              <p>Please review these findings, and let me know when you'd like to schedule a call to discuss the path forward.</p>
          `
       };
    }

    await transporter.sendMail(mailOptions);

    await prisma.audit.update({
      where: { id },
      data: {
        sentAt: new Date(),
        sentTheme: theme
      }
    });

    return NextResponse.json({ success: true, message: `Email delivered to ${lead.email} via ${theme.toUpperCase()}` });
  } catch (error: any) {
    console.error('Dispatch API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to dispatch email.' }, { status: 500 });
  }
}
