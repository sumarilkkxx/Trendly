import nodemailer from 'nodemailer';
import db from '../db.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT, 10) || 465,
    secure: true,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendDigest(items) {
  const trans = getTransporter();
  const to = process.env.NOTIFY_EMAIL;
  if (!trans || !to) return;

  const html = `
    <h2>Trendly 热点通知</h2>
    <p>发现 ${items.length} 条新热点：</p>
    <ul>
      ${items
        .map(
          (i) => `
        <li>
          <strong>${escapeHtml(i.title)}</strong><br/>
          <small>${escapeHtml(i.summary || '')}</small><br/>
          <a href="${escapeHtml(i.url)}">原文链接</a>
        </li>
      `
        )
        .join('')}
    </ul>
  `;

  await trans.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `[Trendly] ${items.length} 条新热点`,
    html,
  });
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
