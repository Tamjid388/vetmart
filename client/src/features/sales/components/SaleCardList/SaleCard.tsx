import { Button, Card, Space, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { SalePaymentStatus, SaleResponse, SaleType } from '../../types/index.ts';
import { formatDateTime, formatTaka } from '../../utils/format.ts';

const statusColor: Record<SalePaymentStatus, string> = {
  PAID: 'success',
  PARTIAL: 'orange',
  DUE: 'error',
};

const typeColor: Record<SaleType, string> = {
  REGISTERED: 'blue',
  CASH: 'gold',
};

type SaleCardProps = {
  sale: SaleResponse;
  onView: (sale: SaleResponse) => void;
};

/** Mobile receipt card — same fields as the desktop table row, no data fetching. */
function SaleCard({ sale, onView }: SaleCardProps) {
  return (
    <Card size="small" className="w-full">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-800">#{sale.invoiceNo}</div>
          <div className="truncate text-xs text-slate-500">
            {sale.customer?.name ?? 'Cash customer'}
          </div>
        </div>
        <Space size={4} className="shrink-0">
          <Tag color={typeColor[sale.saleType]}>{sale.saleType}</Tag>
          <Tag color={statusColor[sale.paymentStatus]}>{sale.paymentStatus}</Tag>
        </Space>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Date</div>
          <div className="truncate text-slate-800">{formatDateTime(sale.saleDate)}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Total</div>
          <div className="font-semibold text-slate-800">{formatTaka(sale.grandTotal)}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Paid</div>
          <div className="text-slate-800">{formatTaka(sale.paidAmount)}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Due</div>
          <div className={sale.dueAmount > 0 ? 'font-medium text-red-600' : 'text-slate-800'}>
            {formatTaka(sale.dueAmount)}
          </div>
        </div>
      </div>

      <div className="mt-2 flex justify-end border-t border-slate-100 pt-2">
        <Space size={8}>
          <Button
            size="middle"
            icon={<EyeOutlined />}
            aria-label={`View ${sale.invoiceNo}`}
            onClick={() => onView(sale)}
          />
        </Space>
      </div>
    </Card>
  );
}

export default SaleCard;
