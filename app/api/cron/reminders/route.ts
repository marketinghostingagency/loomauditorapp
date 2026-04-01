import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import nodemailer from 'nodemailer';

// Since this is a public endpoint, you might want to add a secret token query param in production
// e.g. /api/cron/reminders?key=YOUR_SECRET_CRON_KEY

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    
    // Quick security check so random bots don't trigger your email limit
    // Provide any key as a fallback, or configure CRON_SECRET in your .env
    const validKey = process.env.CRON_SECRET || 'mha-cron-fallback-999';
    if (key !== validKey && process.env.NODE_ENV !== 'development') {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    // 24 hours ago
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    // 25 hours ago
    const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);

    // Find audits exactly inside the 24 to 25 hour window that haven't been sent
    const overdueAudits = await prisma.audit.findMany({
      where: {
        sentAt: null,
        createdAt: {
           lte: twentyFourHoursAgo,
           gt: twentyFiveHoursAgo
        }
      }
    });

    if (overdueAudits.length === 0) {
      return NextResponse.json({ success: true, message: 'No new overdue audits found.' });
    }

    // We have overdue audits!
    // Fetch associated leads
    const leads = await prisma.lead.findMany({
      where: { auditId: { in: overdueAudits.map(a => a.id) } }
    });

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;

    if (!smtpUser || !smtpPass) {
       console.error('CRON Error: Missing SMTP Master Credentials in .env');
       return NextResponse.json({ error: 'SMTP missing' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: smtpUser,
            pass: smtpPass
        }
    });

    // Build the email body
    let auditListHtml = '';
    overdueAudits.forEach(audit => {
       const lead = leads.find(l => l.auditId === audit.id);
       const leadDesc = lead ? `${lead.name} (${lead.email})` : 'Unknown Lead';
       auditListHtml += `
          <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
             <h3 style="margin: 0 0 5px 0;">${audit.brandName}</h3>
             <p style="margin: 0; color: #555;"><strong>Contact:</strong> ${leadDesc}</p>
             <p style="margin: 5px 0 0 0;"><a href="https://audit.marketinghosting.agency/admin/dashboard/${audit.id}" style="color: #dc9f0f; font-weight: bold; text-decoration: none;">Review & Send Audit &rarr;</a></p>
          </div>
       `;
    });

    const mailOptions = {
      from: `"MHA Intelligence Engine" <${smtpUser}>`,
      to: 'joel@marketinghosting.agency',
      subject: `🚨 CRITICAL: ${overdueAudits.length} Audits have been waiting 24 Hours!`,
      html: `
        <h2>Action Required: Unsent Reports</h2>
        <p>The following growth audits were generated naturally over 24 hours ago, but the reports have not been officially dispatched from the dashboard.</p>
        <p>Remember, the frontend expectation promises delivery within 48 hours. Please review these playbooks and issue the final reports:</p>
        ${auditListHtml}
      `
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: `Dispatched reminder for ${overdueAudits.length} audits.` });

  } catch (error: any) {
    console.error('Cron Execution Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
