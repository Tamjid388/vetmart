import { useState } from 'react';
import { Button, Card, Empty, Table, Tabs, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useNavigate } from 'react-router';
import { useSales } from '../../../sales/hooks/useSales/index.ts';
import type {
  SaleItemResponse,
  SalePaymentStatus,
  SaleResponse,
} from '../../../sales/types/index.ts';
import {
  formatDateTime as formatSaleDateTime,
  formatTaka as formatSaleTaka,
} from '../../../sales/utils/format.ts';
import { usePayments } from '../../../payments/hooks/usePayments/index.ts';
import type { PaymentMethod, PaymentResponse } from '../../../payments/types/index.ts';
import {
  formatDateTime as formatPaymentDateTime,
  formatTaka as formatPaymentTaka,
} from '../../../payments/utils/format.ts';

const HISTORY_PAGE_SIZE = 10;

const saleStatusColor: Record<SalePaymentStatus, string> = {
  PAID: 'success',
  PARTIAL: 'orange',
  DUE: 'error',
};

const paymentMethodColor: Record<PaymentMethod, string> = {
  CASH: 'green',
  BKASH: 'pink',
  NAGAD: 'orange',
  CARD: 'blue',
};

const purchaseColumns: TableColumnsType<SaleResponse> = [
  {
    title: 'Date',
    dataIndex: 'saleDate',
    key: 'saleDate',
    render: (saleDate: string) => (
      <span className="whitespace-nowrap">{formatSaleDateTime(saleDate)}</span>
    ),
  },
  {
    title: 'Invoice',
    dataIndex: 'invoiceNo',
    key: 'invoiceNo',
    render: (invoiceNo: string) => (
      <span className="whitespace-nowrap font-medium text-slate-800">#{invoiceNo}</span>
    ),
  },
  {
    title: 'Items',
    key: 'itemsCount',
    align: 'right',
    render: (_, sale) => sale.items.length,
  },
  {
    title: 'Total (৳)',
    dataIndex: 'grandTotal',
    key: 'grandTotal',
    align: 'right',
    render: (grandTotal: number) => formatSaleTaka(grandTotal),
  },
  {
    title: 'Paid (৳)',
    dataIndex: 'paidAmount',
    key: 'paidAmount',
    align: 'right',
    render: (paidAmount: number) => formatSaleTaka(paidAmount),
  },
  {
    title: 'Due (৳)',
    dataIndex: 'dueAmount',
    key: 'dueAmount',
    align: 'right',
    render: (dueAmount: number) => (
      <span className={dueAmount > 0 ? 'font-medium text-red-600' : ''}>
        {formatSaleTaka(dueAmount)}
      </span>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'paymentStatus',
    key: 'paymentStatus',
    render: (status: SalePaymentStatus) => (
      <Tag color={saleStatusColor[status]}>{status}</Tag>
    ),
  },
];

const itemColumns: TableColumnsType<SaleItemResponse> = [
  {
    title: 'Item',
    key: 'item',
    render: (_, item) => (
      <div>
        <div className="font-medium text-slate-800">
          {item.product?.name ?? item.productId}
        </div>
        <div className="text-xs text-slate-500">
          {item.batch?.batchNumber ? `Lot ${item.batch.batchNumber}` : 'No lot info'}
        </div>
      </div>
    ),
  },
  {
    title: 'Qty',
    dataIndex: 'qty',
    key: 'qty',
    align: 'right',
  },
  {
    title: 'Price (৳)',
    dataIndex: 'sellingPrice',
    key: 'sellingPrice',
    align: 'right',
    render: (sellingPrice: number) => formatSaleTaka(sellingPrice),
  },
  {
    title: 'Line Total (৳)',
    dataIndex: 'lineTotal',
    key: 'lineTotal',
    align: 'right',
    render: (lineTotal: number) => formatSaleTaka(lineTotal),
  },
];

const paymentColumns: TableColumnsType<PaymentResponse> = [
  {
    title: 'Collected',
    dataIndex: 'paidAt',
    key: 'paidAt',
    render: (paidAt: string) => (
      <span className="whitespace-nowrap">{formatPaymentDateTime(paidAt)}</span>
    ),
  },
  {
    title: 'Against Sale',
    key: 'sale',
    render: (_, payment) => (
      <span className="whitespace-nowrap">
        {payment.sale ? `#${payment.sale.invoiceNo}` : '—'}
      </span>
    ),
  },
  {
    title: 'Method',
    dataIndex: 'method',
    key: 'method',
    render: (method: PaymentMethod) => (
      <Tag color={paymentMethodColor[method]}>{method}</Tag>
    ),
  },
  {
    title: 'Amount (৳)',
    dataIndex: 'amount',
    key: 'amount',
    align: 'right',
    render: (amount: number) => (
      <span className="font-medium">{formatPaymentTaka(amount)}</span>
    ),
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

type CustomerHistoryProps = {
  customerId: string;
};

function CustomerHistory({ customerId }: CustomerHistoryProps) {
  const navigate = useNavigate();
  const [salesPage, setSalesPage] = useState(1);
  const [paymentsPage, setPaymentsPage] = useState(1);

  const {
    data: sales,
    total: salesTotal,
    isLoading: salesLoading,
  } = useSales({
    customerId,
    sortBy: 'saleDate',
    sortOrder: 'desc',
    page: salesPage,
    limit: HISTORY_PAGE_SIZE,
  });

  const {
    data: payments,
    total: paymentsTotal,
    isLoading: paymentsLoading,
  } = usePayments({
    customerId,
    page: paymentsPage,
    limit: HISTORY_PAGE_SIZE,
  });

  return (
    <Card>
      <Tabs
        defaultActiveKey="purchases"
        items={[
          {
            key: 'purchases',
            label: `Purchases (${salesTotal})`,
            children:
              sales.length === 0 && !salesLoading ? (
                <Empty description="No purchases yet">
                  <Button type="primary" onClick={() => navigate('/sales/new')}>
                    New Sale
                  </Button>
                </Empty>
              ) : (
                <div className="flex flex-col gap-2">
                  <Typography.Text type="secondary">
                    {salesTotal} visit{salesTotal === 1 ? '' : 's'} · newest first — expand a
                    row for item details
                  </Typography.Text>
                  <Table<SaleResponse>
                    rowKey="id"
                    loading={salesLoading}
                    columns={purchaseColumns}
                    dataSource={sales}
                    scroll={{ x: 760 }}
                    expandable={{
                      expandedRowRender: (sale) => (
                        <div className="flex flex-col gap-2">
                          <Table<SaleItemResponse>
                            rowKey="id"
                            columns={itemColumns}
                            dataSource={sale.items}
                            pagination={false}
                            size="small"
                          />
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>Discount {formatSaleTaka(sale.discount)}</span>
                            <span>VAT {formatSaleTaka(sale.vatTotal)}</span>
                            <span>Method {sale.paymentMethod ?? '—'}</span>
                            <Button
                              type="link"
                              size="small"
                              className="!px-0"
                              onClick={() => navigate(`/sales/${sale.id}/edit`)}
                            >
                              View receipt →
                            </Button>
                          </div>
                        </div>
                      ),
                    }}
                    pagination={{
                      current: salesPage,
                      pageSize: HISTORY_PAGE_SIZE,
                      total: salesTotal,
                      showSizeChanger: false,
                      onChange: setSalesPage,
                      showTotal: (entryTotal, range) =>
                        `Showing ${range[0]} to ${range[1]} of ${entryTotal} visits`,
                    }}
                  />
                </div>
              ),
          },
          {
            key: 'payments',
            label: `Payments (${paymentsTotal})`,
            children:
              payments.length === 0 && !paymentsLoading ? (
                <Empty description="No payments collected yet" />
              ) : (
                <div className="flex flex-col gap-2">
                  <Typography.Text type="secondary">
                    {paymentsTotal} collection{paymentsTotal === 1 ? '' : 's'} · newest first
                  </Typography.Text>
                  <Table<PaymentResponse>
                    rowKey="id"
                    loading={paymentsLoading}
                    columns={paymentColumns}
                    dataSource={payments}
                    scroll={{ x: 720 }}
                    pagination={{
                      current: paymentsPage,
                      pageSize: HISTORY_PAGE_SIZE,
                      total: paymentsTotal,
                      showSizeChanger: false,
                      onChange: setPaymentsPage,
                      showTotal: (entryTotal, range) =>
                        `Showing ${range[0]} to ${range[1]} of ${entryTotal} entries`,
                    }}
                  />
                </div>
              ),
          },
        ]}
      />
    </Card>
  );
}

export default CustomerHistory;
