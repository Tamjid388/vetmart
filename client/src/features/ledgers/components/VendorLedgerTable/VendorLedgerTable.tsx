import { Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { Link } from 'react-router';
import type {
  PurchaseItemResponse,
  PurchasePaymentStatus,
  PurchaseResponse,
} from '../../../purchases/types/index.ts';
import { formatDateTime, formatTaka } from '../../../purchases/utils/format.ts';
import { LEDGER_PAGE_SIZE } from '../../types/index.ts';

const statusColor: Record<PurchasePaymentStatus, string> = {
  PAID: 'success',
  PARTIAL: 'orange',
  DUE: 'error',
};

const itemColumns: TableColumnsType<PurchaseItemResponse> = [
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
    title: 'Cost (৳)',
    dataIndex: 'purchasePrice',
    key: 'purchasePrice',
    align: 'right',
    render: (purchasePrice: number) => formatTaka(purchasePrice),
  },
  {
    title: 'Line Total (৳)',
    dataIndex: 'lineTotal',
    key: 'lineTotal',
    align: 'right',
    render: (lineTotal: number) => formatTaka(lineTotal),
  },
];

type VendorLedgerTableProps = {
  data: PurchaseResponse[];
  page: number;
  pageSize?: number;
  total: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
};

function VendorLedgerTable({
  data,
  page,
  pageSize = LEDGER_PAGE_SIZE,
  total,
  isLoading = false,
  onPageChange,
}: VendorLedgerTableProps) {
  const columns: TableColumnsType<PurchaseResponse> = [
    {
      title: 'Date',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      render: (purchaseDate: string) => (
        <span className="whitespace-nowrap">{formatDateTime(purchaseDate)}</span>
      ),
    },
    {
      title: 'Vendor',
      key: 'supplier',
      render: (_, purchase) => {
        const supplierId = purchase.supplier?.id ?? purchase.supplierId;
        const supplierName = purchase.supplier?.companyName ?? 'Vendor';
        return (
          <div>
            <div className="font-medium text-slate-800">
              {supplierId ? (
                <Link to={`/vendors/${supplierId}`} onClick={(e) => e.stopPropagation()}>
                  {supplierName}
                </Link>
              ) : (
                supplierName
              )}
            </div>
            <div className="text-xs text-slate-500">{purchase.supplier?.phone ?? '—'}</div>
          </div>
        );
      },
    },
    {
      title: 'GRN',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      render: (invoiceNo: string) => <span className="whitespace-nowrap font-medium">#{invoiceNo}</span>,
    },
    {
      title: 'Items',
      key: 'itemsCount',
      align: 'right',
      render: (_, purchase) => purchase.items.length,
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
      render: (status: PurchasePaymentStatus) => <Tag color={statusColor[status]}>{status}</Tag>,
    },
  ];

  return (
    <Table<PurchaseResponse>
      rowKey="id"
      loading={isLoading}
      columns={columns}
      dataSource={data}
      scroll={{ x: 900 }}
      expandable={{
        expandedRowRender: (purchase) => (
          <Table<PurchaseItemResponse>
            rowKey="id"
            columns={itemColumns}
            dataSource={purchase.items}
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

export default VendorLedgerTable;
