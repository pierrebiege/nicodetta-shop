'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function OrderActions({
  orderId,
  status,
}: {
  orderId: number;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function call(path: string, body?: Record<string, unknown>) {
    setLoading(path);
    const res = await fetch(`/api/admin/orders/${orderId}/${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    setLoading(null);
    if (!res.ok) {
      alert('Fehler');
      return;
    }
    router.refresh();
  }

  function downloadLabel() {
    window.open(`/api/admin/orders/${orderId}/label`, '_blank');
  }
  function downloadInvoice() {
    window.open(`/api/admin/orders/${orderId}/invoice`, '_blank');
  }

  return (
    <div className="space-y-3 bg-paper border border-ink p-6">
      <h2 className="text-[10px] uppercase tracking-widest opacity-60">Aktionen</h2>

      <Btn onClick={downloadInvoice}>QR-Rechnung als PDF</Btn>

      {status === 'pending' && (
        <>
          <Btn primary loading={loading === 'mark-paid'} onClick={() => call('mark-paid')}>
            Als bezahlt markieren
          </Btn>
          <Btn loading={loading === 'cancel'} onClick={() => call('cancel')}>
            Stornieren
          </Btn>
        </>
      )}

      {status === 'paid' && (
        <>
          <Btn onClick={downloadLabel}>Versandetikette drucken</Btn>
          <Btn
            primary
            loading={loading === 'mark-shipped'}
            onClick={() => {
              const tracking = prompt('Sendungsnummer (optional)') || undefined;
              call('mark-shipped', { trackingCode: tracking });
            }}
          >
            Als versendet markieren
          </Btn>
        </>
      )}

      {status === 'shipped' && (
        <div className="text-sm opacity-60">
          Bestellung abgeschlossen.
        </div>
      )}
    </div>
  );
}

function Btn({
  children,
  onClick,
  primary,
  loading,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full px-4 py-3 text-xs uppercase tracking-widest font-bold border border-ink disabled:opacity-50 ${
        primary ? 'bg-ink text-paper' : 'bg-paper hover:bg-muted'
      }`}
    >
      {loading ? '…' : children}
    </button>
  );
}
