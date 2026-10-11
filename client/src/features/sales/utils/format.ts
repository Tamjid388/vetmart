export function formatTaka(value: number) {
  return `৳${value.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** Line-level 2-decimal rounding — mirrors the server rule so the POS preview matches. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export type PreviewLine = {
  qty: number;
  sellingPrice: number;
  vatPercent: number;
};

export type TotalsPreview = {
  subtotal: number;
  discount: number;
  vatTotal: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
};

export function computeTotalsPreview(
  lines: PreviewLine[],
  discount: number,
  paidAmount: number,
): TotalsPreview {
  let subtotal = 0;
  let vatTotal = 0;
  for (const line of lines) {
    const lineTotal = round2(line.qty * line.sellingPrice);
    subtotal = round2(subtotal + lineTotal);
    vatTotal = round2(vatTotal + round2(lineTotal * (line.vatPercent / 100)));
  }
  const grandTotal = round2(subtotal - discount + vatTotal);
  const dueAmount = round2(grandTotal - paidAmount);
  return { subtotal, discount, vatTotal, grandTotal, paidAmount, dueAmount };
}
