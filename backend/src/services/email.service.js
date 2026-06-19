import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const buildTransport = () => {
  if (env.emailUser && env.emailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: env.emailUser,
        pass: env.emailPass
      }
    });
  }

  return {
    sendMail: async (payload) => {
      console.log('[email-debug] reset password email', {
        to: payload.to,
        subject: payload.subject,
        html: payload.html
      });
      return { messageId: 'debug-reset-mail' };
    }
  };
};

const transporter = buildTransport();

export const sendPasswordResetEmail = async ({ to, token, name }) => {
  const resetUrl = `${env.frontendUrl.replace(/\/$/, '')}/reset-password/${token}`;

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:32px">
      <div style="max-width:560px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:20px;padding:32px">
        <p style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#60a5fa">AI Business Platform</p>
        <h1 style="font-size:28px;line-height:1.2;margin:16px 0 12px">Reset your password</h1>
        <p style="font-size:16px;line-height:1.7;color:#cbd5e1">Hi ${name || 'there'}, we received a request to reset your password.</p>
        <p style="margin:24px 0">
          <a href="${resetUrl}" style="display:inline-block;background:#60a5fa;color:#fff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:700">Reset Password</a>
        </p>
        <p style="font-size:14px;line-height:1.7;color:#94a3b8">This link expires in 15 minutes and can only be used once. If you did not request this, you can safely ignore this email.</p>
        <p style="font-size:12px;line-height:1.6;color:#64748b;margin-top:24px">Security notice: Never share this link with anyone.</p>
      </div>
    </div>
  `;

  return transporter.sendMail({
    to,
    from: env.emailUser || 'no-reply@ai-business-platform.local',
    subject: 'Reset Your Password',
    html
  });
};
