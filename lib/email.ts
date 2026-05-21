// Email stub — logs to console and writes to ./tmp/emails/ for local dev.
// Replace with Resend / SMTP for production.
import fs from 'node:fs/promises';
import path from 'node:path';

export type EmailAttachment = { filename: string; content: Buffer };
export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  attachments?: EmailAttachment[];
};

export async function sendEmail({ to, subject, text, attachments }: SendEmailInput) {
  const dir = path.join(process.cwd(), 'tmp', 'emails');
  await fs.mkdir(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeSubject = subject.replace(/[^a-zA-Z0-9]+/g, '_').slice(0, 40);
  const base = path.join(dir, `${stamp}__${safeSubject}`);
  await fs.writeFile(`${base}.txt`, `To: ${to}\nSubject: ${subject}\n\n${text}`);
  if (attachments) {
    for (const att of attachments) {
      await fs.writeFile(path.join(dir, `${stamp}__${att.filename}`), att.content);
    }
  }
  console.log(`[email] -> ${to} | ${subject} | attachments: ${attachments?.length ?? 0}`);
}
