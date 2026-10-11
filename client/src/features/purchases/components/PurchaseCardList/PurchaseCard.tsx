import { Button, Card, Space, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { PurchasePaymentStatus, PurchaseResponse } from '../../types/index.ts';
import { formatDateTime, formatTaka } from '../../utils/format.ts';

const statusColor: Record<PurchasePaymentStatus, string> = {
  PAID: 'success',
  PARTIAL: 'orange',
  DUE: 'error',
};

type PurchaseCardProps = {
  purchase: PurchaseResponse;
  onView: (purchase: PurchaseResponse) => void;
};

/** Mobile GRN card — same fields as the desktop table row, no data fetching. */
function PurchaseCard({ purchase, onView }: PurchaseCardProps) {
  return (
    <Card size="small" className="w-full">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-800">#{purchase.invoiceNo}</div>
          <div className="truncate text-xs text-slate-500">
            {purchase.supplier?.companyName ?? '—'}
          </div>
        </div>
        <Tag color={statusColor[purchase.paymentStatus]} className="shrink-0">
          {purchase.paymentStatus}
        </Tag>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Date</div>
          <div className="truncate text-slate-800">{formatDateTime(purchase.purchaseDate)}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Total</div>
          <div className="font-semibold text-slate-800">{formatTaka(purchase.grandTotal)}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Paid</div>
          <div className="text-slate-800">{formatTaka(purchase.paidAmount)}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Due</div>
          <div className={purchase.dueAmount > 0 ? 'font-medium text-red-600' : 'text-slate-800'}>
            {formatTaka(purchase.dueAmount)}
          </div>
        </div>
      </div>

      <div className="mt-2 flex justify-end border-t border-slate-100 pt-2">
        <Space size={8}>
          <Button
            size="middle"
            icon={<EyeOutlined />}
            aria-label={`View ${purchase.invoiceNo}`}
            onClick={() => onView(purchase)}
          />
        </Space>
      </div>
    </Card>
  );
}

export default PurchaseCard;
