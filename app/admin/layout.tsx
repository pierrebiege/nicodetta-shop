import Link from 'next/link';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();
  return (
    <div className="min-h-screen bg-muted text-ink">
      <header className="flex items-center justify-between border-b border-ink bg-paper px-6 py-4">
        <Link
          href="/admin"
          className="font-serif text-2xl"
        >
          Nicodetta · Admin
        </Link>
        <nav className="flex items-center gap-6 text-xs uppercase tracking-widest">
          {admin && (
            <>
              <Link href="/admin/products">Pieces</Link>
              <Link href="/admin/museum">Layout</Link>
              <Link href="/admin/orders">Orders</Link>
              <span className="opacity-50">{admin.username}</span>
              <form action="/api/admin/logout" method="post">
                <button type="submit" className="underline">Logout</button>
              </form>
            </>
          )}
        </nav>
      </header>
      <div className="p-6 md:p-10">{children}</div>
    </div>
  );
}
