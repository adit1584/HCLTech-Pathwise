import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter | null> {
  if (transporter) return transporter;

  // 1. If custom SMTP or service is provided in config/.env
  if (config.smtp.user && config.smtp.pass) {
    try {
      if (config.smtp.service || config.smtp.user.endsWith('@gmail.com')) {
        transporter = nodemailer.createTransport({
          service: config.smtp.service || 'gmail',
          auth: {
            user: config.smtp.user,
            pass: config.smtp.pass,
          },
        });
      } else if (config.smtp.host) {
        transporter = nodemailer.createTransport({
          host: config.smtp.host,
          port: config.smtp.port,
          secure: config.smtp.port === 465,
          auth: {
            user: config.smtp.user,
            pass: config.smtp.pass,
          },
        });
      }
      if (transporter) {
        console.log(`[EMAIL] 🚀 Transporter initialized for ${config.smtp.user}`);
        return transporter;
      }
    } catch (err) {
      console.warn('[EMAIL] Failed to initialize configured SMTP:', err);
    }
  }

  // 2. Try Ethereal test transport
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[EMAIL] ℹ️ Using Ethereal sandbox: ${testAccount.user}`);
    return transporter;
  } catch {
    return null;
  }
}

export async function sendOtpEmail(email: string, otp: string, name = 'Learner'): Promise<boolean> {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║ [EMAIL DISPATCH]                                             ║
║ Recipient:  ${email.padEnd(48)}║
║ OTP Code:   ${otp.padEnd(48)}║
║ Expiration: 10 minutes                                       ║
╚══════════════════════════════════════════════════════════════╝
  `);

  try {
    const transport = await getTransporter();
    if (!transport) {
      console.warn(`[EMAIL] No active SMTP transporter. OTP logged in console above.`);
      return false;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pathwise Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #060810; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #060810; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="540" border="0" cellspacing="0" cellpadding="0" style="max-width: 540px; background: #0c111e; border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.8);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06); background: linear-gradient(180deg, rgba(245,158,11,0.08) 0%, transparent 100%);">
              <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; border-radius: 14px; background: linear-gradient(135deg, #fef08a 0%, #f59e0b 50%, #d97706 100%); font-size: 22px; margin-bottom: 12px; box-shadow: 0 4px 18px rgba(245,158,11,0.5);">
                🧭
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em;">
                Pathwise
              </h1>
              <p style="margin: 4px 0 0; font-size: 11px; font-family: monospace; color: #fbbf24; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">
                Personalized Learning Intelligence
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 32px 28px;">
              <h2 style="margin: 0 0 12px; font-size: 17px; font-weight: 700; color: #ffffff;">
                Verify your email address
              </h2>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                Hello <strong>${name}</strong>,<br>
                Thank you for joining Pathwise. Use the 6-digit verification code below to verify your email and activate your adaptive learning curriculum:
              </p>

              <!-- OTP Code Display -->
              <div style="background: rgba(245, 158, 11, 0.08); border: 2px dashed rgba(245, 158, 11, 0.4); border-radius: 16px; padding: 22px; text-align: center; margin: 20px 0 28px;">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 12px; color: #fbbf24; display: block;">
                  ${otp}
                </span>
                <span style="display: block; font-size: 11px; color: #94a3b8; font-family: monospace; margin-top: 8px;">
                  ⏳ Code valid for 10 minutes (Single Use)
                </span>
              </div>

              <p style="margin: 0 0 8px; font-size: 12.5px; line-height: 1.5; color: #64748b;">
                • Never share this code with anyone.<br>
                • If you did not create a Pathwise account, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.06); text-align: center;">
              <p style="margin: 0; font-size: 11px; font-family: monospace; color: #475569;">
                Deterministic Learning DAG Compiler · HCL Tech Hackathon 2026
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const info = await transport.sendMail({
      from: config.smtp.from || 'Pathwise <no-reply@pathwise.dev>',
      to: email,
      subject: `[Pathwise] Your Verification Code: ${otp}`,
      text: `Hello ${name},\n\nYour Pathwise 6-digit verification code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this code, please ignore this email.`,
      html: htmlContent,
    });

    console.log(`[EMAIL] ✉️  Verification OTP dispatched to ${email} (MessageId: ${info.messageId || 'ok'})`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] ❌ Failed to dispatch email to ${email}:`, error);
    return false;
  }
}
