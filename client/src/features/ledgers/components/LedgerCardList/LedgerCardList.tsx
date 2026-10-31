import { Card, Pagination, Tag } from 'antd';
import type { SalePaymentStatus, SaleResponse } from '../../../sales/types/index.ts';
import { formatDateTime, formatTaka } from '../../../sales/utils/format.ts';
import { LEDGER_PAGE_SIZE } from '../../types/index.ts';

const statusColor: Record<SalePaymentStatus, string> = {
  PAID: 'success',
  PARTIAL: 'orange',
  DUE: 'error',
};

type LedgerCardListProps = {
  data: SaleResponse[];
  page: number;
  pageSize?: number;
  total: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
};

function LedgerCardList({ data, page, pageSize = LEDGER_PAGE_SIZE, total, loading = false, onPageChange }: LedgerCardListProps) {
  return (
    <div className="flex flex-col gap-3">
      {data.map((sale) => (
        <Card key={sale.id} loading={loading} size="small">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-medium text-slate-800">{sale.customer?.name ?? 'Cash Customer'}</div>
              <div className="text-xs text-slate-500">
                {[sale.customer?.phone, sale.customer?.area].filter(Boolean).join(' · ') || '—'}
              </div>
            </div>
            <Tag color={statusColor[sale.paymentStatus]}>{sale.paymentStatus}</Tag>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            #{sale.invoiceNo} · {formatDateTime(sale.saleDate)} · {sale.items.length} item{sale.items.length === 1 ? '' : 's'}
          </div>
          <div className="mt-1 text-xs text-slate-600">
            {sale.items.slice(0, 3).map((item) => item.product?.name ?? item.productId).join(', ')}
            {sale.items.length > 3 ? ` +${sale.items.length - 3} more` : ''}
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span>Bill {formatTaka(sale.grandTotal)}</span>
            <span>Paid {formatTaka(sale.paidAmount)}</span>
            <span className={sale.dueAmount > 0 ? 'font-medium text-red-600' : ''}>
              Due {formatTaka(sale.dueAmount)}
            </span>
          </div>
        </Card>
      ))}
      <Pagination
        current={page}
        pageSize={pageSize}
        total={total}
        showSizeChanger={false}
        onChange={onPageChange}
        className="self-center"
      />
    </div>
  );
}

export default LedgerCardList;
