'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function BuyForm({ productId }: { productId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload = {
      productId,
      buyerName: String(fd.get('name')),
      buyerEmail: String(fd.get('email')),
      buyerStreet: String(fd.get('street')),
      buyerZip: String(fd.get('zip')),
      buyerCity: String(fd.get('city')),
      buyerCountry: String(fd.get('country') || 'CH'),
    };

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Bestellung fehlgeschlagen');
      setLoading(false);
      return;
    }

    const { reference } = await res.json();
    router.push(`/danke?ref=${reference}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <Field name="name" label="Name" required />
      <Field name="email" label="E-Mail" type="email" required />
      <Field name="street" label="Strasse + Nr." required />
      <div className="grid grid-cols-3 gap-3">
        <Field name="zip" label="PLZ" required className="col-span-1" />
        <Field name="city" label="Ort" required className="col-span-2" />
      </div>
      <Field name="country" label="Land" defaultValue="CH" required />

      {error && <div className="text-accent text-sm">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="bg-ink text-paper py-4 text-sm font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-accent transition-colors"
      >
        {loading ? 'Sende…' : 'Verbindlich bestellen'}
      </button>

      <p className="text-[11px] opacity-60 leading-relaxed">
        Du erhältst eine QR-Rechnung per E-Mail. Werk wird nach Zahlungseingang
        versandt. Reservation 7 Tage gültig.
      </p>
    </form>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
  defaultValue,
  className = '',
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] uppercase tracking-widest opacity-60">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="border border-ink px-3 py-2 text-sm bg-paper focus:bg-muted focus:outline-none"
      />
    </label>
  );
}
