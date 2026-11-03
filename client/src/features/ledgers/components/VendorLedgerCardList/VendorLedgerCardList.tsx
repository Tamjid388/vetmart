import { useState } from 'react';
import { Button, Card, Empty, Pagination, Skeleton, Tag } from 'antd';
import { DownOutlined, EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { Link } from 'react-router';
import type { PurchasePaymentStatus, PurchaseResponse } from '../../../purchases/types/index.ts';
import { formatDateTime, formatTaka } from '../../../purchases/utils/format.ts';
import { LEDGER_PAGE_SIZE } from '../../types/index.ts';

const statusColor: Record<PurchasePaymentStatus, string> = {
  PAID: 'success',
  PARTIAL: 'orange',
  DUE: 'error',
};

type VendorLedgerCardListProps = {
  data: PurchaseResponse[];
  page: number;
  pageSize?: number;
  total: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
};

function VendorLedgerCardList({
  data,
  page,
  pageSize = LEDGER_PAGE_SIZE,
  total,
  loading = false,
  onPageChange,
}: VendorLedgerCardListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} size="small" className="w-full">
            <Skeleton active paragraph={{ rows: 3 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return <Empty description="No vendor entries found" className="py-8" />;
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((purchase) => {
        const expanded = expandedIds.has(purchase.id);
        return (
          <Card key={purchase.id} loading={loading} size="small">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-800">
                  {purchase.supplier?.id ?? purchase.supplierId ? (
                    <Link to={`/vendors/${purchase.supplier?.id ?? purchase.supplierId}`}>
                      {purchase.supplier?.companyName ?? 'Vendor'}
                    </Link>
                  ) : (
                    (purchase.supplier?.companyName ?? 'Vendor')
                  )}
                </div>
                <div className="text-xs text-slate-500">{purchase.supplier?.phone ?? '—'}</div>
              </div>
              <Tag color={statusColor[purchase.paymentStatus]}>{purchase.paymentStatus}</Tag>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              #{purchase.invoiceNo} · {formatDateTime(purchase.purchaseDate)} · {purchase.items.length} item
              {purchase.items.length === 1 ? '' : 's'}
            </div>
            <div className="mt-2 grid grid-cols-3 gap-x-2 gap-y-1 text-sm">
              <div className="min-w-0">
                <div className="text-[11px] text-slate-500">Bill</div>
                <div className="truncate font-medium text-slate-800">{formatTaka(purchase.grandTotal)}</div>
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-500">Paid</div>
                <div className="truncate text-slate-800">{formatTaka(purchase.paidAmount)}</div>
              </div>
              <div className="min-w-0 text-right">
                <div className="text-[11px] text-slate-500">Due</div>
                <div
                  className={`truncate ${purchase.dueAmount > 0 ? 'font-medium text-red-600' : 'text-slate-800'}`}
                >
                  {formatTaka(purchase.dueAmount)}
                </div>
              </div>
            </div>
            <div className="mt-2 border-t border-slate-100 pt-2">
              <Button
                block
                onClick={() => toggleExpanded(purchase.id)}
                aria-expanded={expanded}
                aria-label={
                  expanded
                    ? `Hide full details for invoice ${purchase.invoiceNo}`
                    : `View full details for invoice ${purchase.invoiceNo}, ${purchase.items.length} items`
                }
                icon={expanded ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 font-medium text-blue-700 shadow-none hover:!border-blue-400 hover:!bg-blue-100 hover:!text-blue-800 active:!bg-blue-200"
              >
                <span className="flex-1 text-left">
                  {expanded
                    ? 'Hide full details'
                    : `View full details · ${purchase.items.length} item${purchase.items.length === 1 ? '' : 's'}`}
                </span>
                <DownOutlined className={`text-xs transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
              </Button>
              {expanded ? (
                <div className="mt-1 flex flex-col gap-2">
                  {purchase.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-2 rounded bg-slate-50 px-2 py-1.5"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-slate-800">
                          {item.product?.name ?? item.productId}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.batch?.batchNumber ? `Lot ${item.batch.batchNumber}` : 'No lot info'} · Qty{' '}
                          {item.qty} × {formatTaka(item.purchasePrice)}
                        </div>
                      </div>
                      <div className="shrink-0 text-[13px] font-medium text-slate-800">
                        {formatTaka(item.lineTotal)}
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col gap-0.5 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{formatTaka(purchase.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount</span>
                      <span>{formatTaka(purchase.discount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>VAT</span>
                      <span>{formatTaka(purchase.vatTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Method</span>
                      <span>{purchase.paymentMethod ?? '— (fully due)'}</span>
                    </div>
                    {purchase.notes ? (
                      <div className="break-words">
                        <span>Note: </span>
                        <span className="text-slate-600">{purchase.notes}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-xs text-slate-600">
                  {purchase.items.slice(0, 3).map((item) => item.product?.name ?? item.productId).join(', ')}
                  {purchase.items.length > 3 ? ` +${purchase.items.length - 3} more` : ''}
                </div>
              )}
            </div>
          </Card>
        );
      })}
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

export default VendorLedgerCardList;
