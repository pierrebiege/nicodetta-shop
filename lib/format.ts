export function formatCHF(rappen: number) {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rappen / 100);
}

export function chfPlain(rappen: number) {
  return (rappen / 100).toFixed(2);
}
