import { Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { PAGE_SIZE } from '../../data/payment.constants.ts';
import type { PaymentMethod, PaymentResponse } from '../../types/index.ts';
import { formatDateTime, formatTaka } from '../../utils/format.ts';

const methodColor: Record<PaymentMethod, string> = {
  CASH: 'green',
  BKASH: 'pink',
  NAGAD: 'orange',
  CARD: 'blue',
};

type PaymentTableProps = {
  data: PaymentResponse[];
  page: number;
  pageSize?: number;
  total: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
};

function PaymentTable({
  data,
  page,
  pageSize = PAGE_SIZE,
  total,
  isLoading = false,
  onPageChange,
}: PaymentTableProps) {
  const columns: TableColumnsType<PaymentResponse> = [
    {
      title: 'Collected',
      dataIndex: 'paidAt',
      key: 'paidAt',
      render: (paidAt: string) => (
        <span className="whitespace-nowrap">{formatDateTime(paidAt)}</span>
      ),
    },
    {
      title: 'Party',
      key: 'party',
      render: (_, payment) => {
        const name = payment.customer?.name ?? payment.supplier?.companyName ?? '—';
        const phone = payment.customer?.phone ?? payment.supplier?.phone ?? '';
        return (
          <div>
            <div className="font-medium text-slate-800">{name}</div>
            <div className="text-xs text-slate-500">{phone}</div>
          </div>
        );
      },
    },
    {
      title: 'Linked',
      key: 'linked',
      render: (_, payment) => (
        <span className="whitespace-nowrap">
          {payment.sale
            ? `#${payment.sale.invoiceNo}`
            : payment.purchase
              ? `#${payment.purchase.invoiceNo}`
              : '—'}
        </span>
      ),
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (method: PaymentMethod) => <Tag color={methodColor[method]}>{method}</Tag>,
    },
    {
      title: 'Amount (৳)',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount: number) => <span className="font-medium">{formatTaka(amount)}</span>,
    },
    {
      title: 'Collected By',
      key: 'collectedBy',
      render: (_, payment) => (
        <span className="text-slate-600">
          {payment.collectedByUser?.name ?? payment.collectedByUser?.email ?? '—'}
        </span>
      ),
    },
  ];

  return (
    <Table<PaymentResponse>
      rowKey="id"
      loading={isLoading}
      columns={columns}
      dataSource={data}
      scroll={{ x: 820 }}
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

export default PaymentTable;
