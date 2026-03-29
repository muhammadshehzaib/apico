import nodemailer from 'nodemailer';
import { env } from '../config/env.config';

const getSmtpConfig = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !from || !user || !pass || Number.isNaN(port)) {
    return null;
  }

  return {
    host,
    port,
    auth: { user, pass },
    from,
  };
};

let cachedTransporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const config = getSmtpConfig();
  if (!config) return null;

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: config.auth,
  });

  return cachedTransporter;
};

export const sendWorkspaceInviteEmail = async (input: {
  to: string;
  inviterName: string;
  workspaceName: string;
  inviteLink: string;
  expiresAt?: Date | null;
}) => {
  if (env.NODE_ENV === 'test') {
    console.warn('[Email] Skipping invite email in test environment');
    return { sent: false };
  }

  const transporter = getTransporter();
  const config = getSmtpConfig();
  if (!transporter || !config) {
    console.warn('[Email] SMTP not configured. Skipping invite email.');
    return { sent: false };
  }

  const expiresText = input.expiresAt
    ? `This invite expires on ${input.expiresAt.toDateString()}.`
    : 'This invite does not expire.';

  const subject = `${input.inviterName} invited you to ${input.workspaceName}`;
  const text = [
    `You have been invited to join the workspace "${input.workspaceName}".`,
    `Invited by: ${input.inviterName}`,
    `Accept your invite: ${input.inviteLink}`,
    expiresText,
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
      <h2>Workspace Invite</h2>
      <p>You have been invited to join the workspace <strong>${input.workspaceName}</strong>.</p>
      <p>Invited by: <strong>${input.inviterName}</strong></p>
      <p><a href="${input.inviteLink}">Accept your invite</a></p>
      <p style="color:#666;">${expiresText}</p>
    </div>
  `;

  await transporter.sendMail({
    from: config.from,
    to: input.to,
    subject,
    text,
    html,
  });

  return { sent: true };
};
