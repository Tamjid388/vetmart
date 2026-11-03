import { Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { Link } from 'react-router';
import type { SaleItemResponse, SalePaymentStatus, SaleResponse } from '../../../sales/types/index.ts';
import { formatDateTime, formatTaka } from '../../../sales/utils/format.ts';
import { LEDGER_PAGE_SIZE } from '../../types/index.ts';

const statusColor: Record<SalePaymentStatus, string> = {
  PAID: 'success',
  PARTIAL: 'orange',
  DUE: 'error',
};

const itemColumns: TableColumnsType<SaleItemResponse> = [
  {
    title: 'Item',
    key: 'item',
    render: (_, item) => (
      <div>
        <div className="font-medium text-slate-800">{item.product?.name ?? item.productId}</div>
        <div className="text-xs text-slate-500">
          {item.batch?.batchNumber ? `Lot ${item.batch.batchNumber}` : 'No lot info'}
        </div>
      </div>
    ),
  },
  { title: 'Qty', dataIndex: 'qty', key: 'qty', align: 'right' },
  {
    title: 'Price (৳)',
    dataIndex: 'sellingPrice',
    key: 'sellingPrice',
    align: 'right',
    render: (sellingPrice: number) => formatTaka(sellingPrice),
  },
  {
    title: 'Line Total (৳)',
    dataIndex: 'lineTotal',
    key: 'lineTotal',
    align: 'right',
    render: (lineTotal: number) => formatTaka(lineTotal),
  },
];

type LedgerTableProps = {
  data: SaleResponse[];
  page: number;
  pageSize?: number;
  total: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
};

function LedgerTable({ data, page, pageSize = LEDGER_PAGE_SIZE, total, isLoading = false, onPageChange }: LedgerTableProps) {
  const columns: TableColumnsType<SaleResponse> = [
    {
      title: 'Date',
      dataIndex: 'saleDate',
      key: 'saleDate',
      render: (saleDate: string) => <span className="whitespace-nowrap">{formatDateTime(saleDate)}</span>,
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, sale) => {
        const customerId = sale.customer?.id ?? sale.customerId;
        const customerName = sale.customer?.name ?? (sale.customerId ? 'Customer' : 'Cash Customer');
        return (
          <div>
            <div className="font-medium text-slate-800">
              {customerId ? (
                <Link to={`/customers/${customerId}`} onClick={(e) => e.stopPropagation()}>
                  {customerName}
                </Link>
              ) : (
                customerName
              )}
            </div>
            <div className="text-xs text-slate-500">
              {[sale.customer?.phone, sale.customer?.area].filter(Boolean).join(' · ') || '—'}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Invoice',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      render: (invoiceNo: string) => <span className="whitespace-nowrap font-medium">#{invoiceNo}</span>,
    },
    {
      title: 'Items',
      key: 'itemsCount',
      align: 'right',
      render: (_, sale) => sale.items.length,
    },
    {
      title: 'Bill (৳)',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      align: 'right',
      render: (grandTotal: number) => formatTaka(grandTotal),
    },
    {
      title: 'Paid (৳)',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      align: 'right',
      render: (paidAmount: number) => formatTaka(paidAmount),
    },
    {
      title: 'Due (৳)',
      dataIndex: 'dueAmount',
      key: 'dueAmount',
      align: 'right',
      render: (dueAmount: number) => (
        <span className={dueAmount > 0 ? 'font-medium text-red-600' : ''}>{formatTaka(dueAmount)}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: SalePaymentStatus) => <Tag color={statusColor[status]}>{status}</Tag>,
    },
  ];

  return (
    <Table<SaleResponse>
      rowKey="id"
      loading={isLoading}
      columns={columns}
      dataSource={data}
      scroll={{ x: 900 }}
      expandable={{
        expandedRowRender: (sale) => (
          <Table<SaleItemResponse>
            rowKey="id"
            columns={itemColumns}
            dataSource={sale.items}
            pagination={false}
            size="small"
          />
        ),
      }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: false,
        onChange: onPageChange,
        showTotal: (entryTotal, range) => `Showing ${range[0]} to ${range[1]} of ${entryTotal} entries`,
      }}
    />
  );
}

export default LedgerTable;
