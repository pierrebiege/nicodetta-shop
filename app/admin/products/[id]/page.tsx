import { redirect, notFound } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { db } from '@/db';
import { products } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ProductForm } from '@/components/ProductForm';

type Props = { params: Promise<{ id: string }> };

export default async function EditProduct({ params }: Props) {
  if (!(await getCurrentAdmin())) redirect('/admin/login');
  const { id } = await params;
  const [product] = await db.select().from(products).where(eq(products.id, Number(id)));
  if (!product) notFound();
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display font-black uppercase text-4xl mb-8">
        {product.title}
      </h1>
      <ProductForm product={product} />
    </div>
  );
}
