import { Button, Space, Table, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { PAGE_SIZE } from '../../data/sale.constants.ts';
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

type SaleTableProps = {
  data: SaleResponse[];
  page: number;
  pageSize?: number;
  total: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onView: (sale: SaleResponse) => void;
};

function SaleTable({
  data,
  page,
  pageSize = PAGE_SIZE,
  total,
  isLoading = false,
  onPageChange,
  onView,
}: SaleTableProps) {
  const columns: TableColumnsType<SaleResponse> = [
    {
      title: 'Invoice',
      dataIndex: 'invoiceNo',
      key: 'invoiceNo',
      render: (invoiceNo: string) => (
        <span className="font-medium text-slate-800">#{invoiceNo}</span>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'saleDate',
      key: 'saleDate',
      render: (saleDate: string) => (
        <span className="whitespace-nowrap">{formatDateTime(saleDate)}</span>
      ),
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, sale) =>
        sale.customer ? (
          <span className="font-medium text-slate-800">{sale.customer.name}</span>
        ) : (
          <Tag>Cash Customer</Tag>
        ),
    },
    {
      title: 'Type',
      dataIndex: 'saleType',
      key: 'saleType',
      width: 120,
      render: (saleType: SaleType) => <Tag color={typeColor[saleType]}>{saleType}</Tag>,
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
      render: (status: SalePaymentStatus) => <Tag color={statusColor[status]}>{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      fixed: 'right',
      render: (_, sale) => (
        <Space size={10}>
          <Button
            size="middle"
            icon={<EyeOutlined />}
            aria-label={`View ${sale.invoiceNo}`}
            onClick={() => onView(sale)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Table<SaleResponse>
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

export default SaleTable;
