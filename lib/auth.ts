import { cookies } from 'next/headers';
import { db } from '@/db';
import { sessions, admins } from '@/db/schema';
import { eq, gt, and } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

const COOKIE = 'nicodetta_session';
const TTL_DAYS = 30;

export async function login(username: string, password: string) {
  const [admin] = await db.select().from(admins).where(eq(admins.username, username));
  if (!admin) return null;
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) return null;

  const sessionId = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 3600 * 1000);
  await db.insert(sessions).values({ id: sessionId, adminId: admin.id, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });
  return admin;
}

export async function logout() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE)?.value;
  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    cookieStore.delete(COOKIE);
  }
}

export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(COOKIE)?.value;
  if (!sessionId) return null;

  const [row] = await db
    .select({ admin: admins })
    .from(sessions)
    .innerJoin(admins, eq(sessions.adminId, admins.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())));

  return row?.admin ?? null;
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('UNAUTHORIZED');
  return admin;
}
