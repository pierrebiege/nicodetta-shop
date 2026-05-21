import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import { ProductForm } from '@/components/ProductForm';

export default async function NewProduct() {
  if (!(await getCurrentAdmin())) redirect('/admin/login');
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display font-black uppercase text-4xl mb-8">
        Neues Werk
      </h1>
      <ProductForm />
    </div>
  );
}
