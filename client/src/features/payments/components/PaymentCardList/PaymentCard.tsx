import { Card, Tag } from 'antd';
import type { PaymentMethod, PaymentResponse } from '../../types/index.ts';
import { formatDateTime, formatTaka } from '../../utils/format.ts';

const methodColor: Record<PaymentMethod, string> = {
  CASH: 'green',
  BKASH: 'pink',
  NAGAD: 'orange',
  CARD: 'blue',
};

type PaymentCardProps = {
  payment: PaymentResponse;
};

/** Mobile payment card — same fields as the desktop table row, no data fetching. */
function PaymentCard({ payment }: PaymentCardProps) {
  const name = payment.customer?.name ?? payment.supplier?.companyName ?? '—';
  const phone = payment.customer?.phone ?? payment.supplier?.phone ?? '';
  const linked = payment.sale
    ? `#${payment.sale.invoiceNo}`
    : payment.purchase
      ? `#${payment.purchase.invoiceNo}`
      : '—';

  return (
    <Card size="small" className="w-full">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[#16A34A]">
            {formatTaka(payment.amount)}
          </div>
          <div className="truncate text-xs text-slate-500">
            {name}
            {phone ? ` · ${phone}` : ''}
          </div>
        </div>
        <Tag color={methodColor[payment.method]} className="shrink-0">
          {payment.method}
        </Tag>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Collected</div>
          <div className="truncate text-slate-800">{formatDateTime(payment.paidAt)}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Linked</div>
          <div className="truncate text-slate-800">{linked}</div>
        </div>
        <div className="col-span-2 min-w-0">
          <div className="text-[11px] text-slate-500">Collected By</div>
          <div className="truncate text-slate-600">
            {payment.collectedByUser?.name ?? payment.collectedByUser?.email ?? '—'}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default PaymentCard;
