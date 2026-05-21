'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        username: fd.get('username'),
        password: fd.get('password'),
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Login fehlgeschlagen');
      setLoading(false);
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest opacity-60">Admin</p>
          <h1 className="font-display font-black uppercase text-4xl">Login</h1>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest opacity-60">
            Username
          </span>
          <input
            name="username"
            required
            autoFocus
            className="border border-ink px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest opacity-60">
            Passwort
          </span>
          <input
            type="password"
            name="password"
            required
            className="border border-ink px-3 py-2 text-sm"
          />
        </label>
        {error && <div className="text-accent text-sm">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-paper py-4 text-sm font-bold uppercase tracking-widest disabled:opacity-50"
        >
          {loading ? '…' : 'Einloggen'}
        </button>
      </form>
    </main>
  );
}
