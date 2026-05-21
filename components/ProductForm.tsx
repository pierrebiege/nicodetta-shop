'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Product } from '@/db/schema';

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagePath, setImagePath] = useState(product?.imagePath ?? '');

  async function uploadImage(file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
    if (!res.ok) throw new Error('Upload fehlgeschlagen');
    const { path } = await res.json();
    return path as string;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get('imageFile') as File | null;
    let path = imagePath;
    if (file && file.size > 0) {
      try {
        path = await uploadImage(file);
        setImagePath(path);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler');
        setLoading(false);
        return;
      }
    }
    if (!path) {
      setError('Bild fehlt');
      setLoading(false);
      return;
    }

    const payload = {
      type: fd.get('type'),
      title: fd.get('title'),
      slug: fd.get('slug'),
      description: fd.get('description'),
      priceRappen: Math.round(Number(fd.get('priceChf')) * 100),
      imagePath: path,
      width: fd.get('width') ? Number(fd.get('width')) : null,
      height: fd.get('height') ? Number(fd.get('height')) : null,
      year: fd.get('year') ? Number(fd.get('year')) : null,
      technique: fd.get('technique') || null,
      status: fd.get('status'),
    };

    const url = product ? `/api/admin/products/${product.id}` : '/api/admin/products';
    const method = product ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Speichern fehlgeschlagen');
      setLoading(false);
      return;
    }
    router.push('/admin/products');
    router.refresh();
  }

  async function handleDelete() {
    if (!product) return;
    if (!confirm('Werk wirklich löschen?')) return;
    const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/admin/products');
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-6">
      <div className="col-span-12 md:col-span-5">
        <div className="relative aspect-[4/5] bg-muted border border-ink">
          {imagePath && (
            <Image src={imagePath} alt="Vorschau" fill className="object-contain" />
          )}
        </div>
        <label className="block mt-3">
          <span className="text-[10px] uppercase tracking-widest opacity-60">
            Bild {imagePath ? '(ersetzen)' : 'hochladen'}
          </span>
          <input
            type="file"
            name="imageFile"
            accept="image/*"
            className="block w-full text-xs mt-1"
          />
        </label>
      </div>

      <div className="col-span-12 md:col-span-7 space-y-4">
        <Field name="title" label="Titel" defaultValue={product?.title} required />
        <Field
          name="slug"
          label="Slug (URL-Pfad)"
          defaultValue={product?.slug}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest opacity-60">
              Typ
            </span>
            <select
              name="type"
              defaultValue={product?.type ?? 'painting'}
              className="border border-ink px-3 py-2 text-sm bg-paper"
            >
              <option value="painting">Bild</option>
              <option value="clothing">Kleidung</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest opacity-60">
              Status
            </span>
            <select
              name="status"
              defaultValue={product?.status ?? 'available'}
              className="border border-ink px-3 py-2 text-sm bg-paper"
            >
              <option value="available">Verfügbar</option>
              <option value="reserved">Reserviert</option>
              <option value="sold">Verkauft</option>
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest opacity-60">
            Beschreibung
          </span>
          <textarea
            name="description"
            defaultValue={product?.description}
            required
            rows={5}
            className="border border-ink px-3 py-2 text-sm bg-paper"
          />
        </label>
        <div className="grid grid-cols-3 gap-4">
          <Field
            name="priceChf"
            label="Preis CHF"
            type="number"
            defaultValue={product ? (product.priceRappen / 100).toString() : ''}
            required
            step="1"
          />
          <Field
            name="year"
            label="Jahr"
            type="number"
            defaultValue={product?.year?.toString() ?? ''}
          />
          <Field
            name="technique"
            label="Technik"
            defaultValue={product?.technique ?? ''}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field
            name="width"
            label="Breite cm"
            type="number"
            defaultValue={product?.width?.toString() ?? ''}
          />
          <Field
            name="height"
            label="Höhe cm"
            type="number"
            defaultValue={product?.height?.toString() ?? ''}
          />
        </div>

        {error && <div className="text-accent text-sm">{error}</div>}

        <div className="flex gap-3 pt-4 border-t border-ink">
          <button
            type="submit"
            disabled={loading}
            className="bg-ink text-paper px-6 py-3 text-xs uppercase tracking-widest font-bold disabled:opacity-50"
          >
            {loading ? '…' : 'Speichern'}
          </button>
          {product && (
            <button
              type="button"
              onClick={handleDelete}
              className="border border-ink px-6 py-3 text-xs uppercase tracking-widest hover:bg-accent hover:text-paper hover:border-accent"
            >
              Löschen
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = 'text',
  required,
  defaultValue,
  step,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest opacity-60">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        step={step}
        className="border border-ink px-3 py-2 text-sm bg-paper"
      />
    </label>
  );
}
