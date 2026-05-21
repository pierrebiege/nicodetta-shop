import { NextResponse } from 'next/server';
import { login } from '@/lib/auth';

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: 'Username + Passwort nötig' }, { status: 400 });
  }
  const admin = await login(username, password);
  if (!admin) {
    return NextResponse.json({ error: 'Falsche Zugangsdaten' }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
