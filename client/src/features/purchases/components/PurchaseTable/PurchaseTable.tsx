import { Button, Space, Table, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { PAGE_SIZE } from '../../data/purchase.constants.ts';
import type { PurchasePaymentStatus, PurchaseResponse } from '../../types/index.ts';
import { formatDateTime, formatTaka } from '../../utils/format.ts';

const statusColor: Record<PurchasePaymentStatus, string> = {
  PAID: 'success',
  PARTIAL: 'orange',
  DUE: 'error',
};

type PurchaseTableProps = {
  data: PurchaseResponse[];
  page: number;
  pageSize?: number;
  total: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onView: (purchase: PurchaseResponse) => void;
};

function PurchaseTable({
  data,
  page,
  pageSize = PAGE_SIZE,
  total,
  isLoading = false,
  onPageChange,
  onView,
}: PurchaseTableProps) {
  const columns: TableColumnsType<PurchaseResponse> = [
    {
      title: 'GRN',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      render: (invoiceNo: string) => (
        <span className="font-medium text-slate-800">#{invoiceNo}</span>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      render: (purchaseDate: string) => (
        <span className="whitespace-nowrap">{formatDateTime(purchaseDate)}</span>
      ),
    },
    {
      title: 'Supplier',
      key: 'supplier',
      render: (_, purchase) => (
        <span className="font-medium text-slate-800">{purchase.supplier?.companyName ?? '—'}</span>
      ),
    },
    {
      title: 'Total (৳)',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      align: 'right',
      render: (grandTotal: number) => formatTaka(grandTotal),
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: PurchasePaymentStatus) => <Tag color={statusColor[status]}>{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, purchase) => (
        <Space size={10}>
          <Button
            size="middle"
            icon={<EyeOutlined />}
            aria-label={`View ${purchase.invoiceNo}`}
            onClick={() => onView(purchase)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Table<PurchaseResponse>
      rowKey="id"
      loading={isLoading}
      columns={columns}
      dataSource={data}
      scroll={{ x: 720 }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: false,
        onChange: onPageChange,
        showTotal: (entryTotal, range) =>
          `Showing ${range[0]} to ${range[1]} of ${entryTotal} entries`,
      }}
    />
  );
}

export default PurchaseTable;
