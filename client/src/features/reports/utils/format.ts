export function formatTaka(value: number): string {
  return `৳${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function formatDateTime(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
