import { App, Button, Card, Descriptions, Empty, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useNavigate } from 'react-router';
import { useMe } from '../../../auth/index.ts';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import { useSaleMutations } from '../../hooks/useSaleMutations/index.ts';
import type { SaleItemResponse, SalePaymentStatus, SaleResponse } from '../../types/index.ts';
import { formatDateTime, formatTaka } from '../../utils/format.ts';

const statusColor: Record<SalePaymentStatus, string> = {
  PAID: 'success',
  PARTIAL: 'orange',
  DUE: 'error',
};

type SaleDetailsProps = {
  sale: SaleResponse | null;
};

/** Receipt view — purchasePrice snapshots render for admin only. */
function SaleDetails({ sale }: SaleDetailsProps) {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const { isAdmin } = useMe();
  const isMobile = useIsMobile();
  const { voidSale, isVoiding } = useSaleMutations();

  const handleVoid = () => {
    if (!sale) return;
    modal.confirm({
      title: 'Void sale',
      content: `Void sale #${sale.invoiceNo}? Stock will be restocked and the due of ${formatTaka(sale.dueAmount)} reversed. This cannot be undone.`,
      okText: 'Void Sale',
      okType: 'danger',
      okButtonProps: { loading: isVoiding },
      onOk: () => {
        voidSale(sale.id, {
          onSuccess: () => {
            message.success(`Sale #${sale.invoiceNo} voided`);
            navigate('/sales');
          },
          onError: (error) => {
            message.error(getApiErrorMessage(error, 'Failed to void sale'));
          },
        });
      },
    });
  };

  if (!sale) {
    return (
      <Card>
        <Empty description="Sale not found" />
      </Card>
    );
  }

  const itemColumns: TableColumnsType<SaleItemResponse> = [
    {
      title: 'Product',
      key: 'product',
      render: (_, item) => (
        <div>
          <div className="font-medium text-slate-800">{item.product?.name ?? item.productId}</div>
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
      render: (sellingPrice: number) => formatTaka(sellingPrice),
    },
    ...(isAdmin
      ? [
          {
            title: 'Cost (৳)',
            dataIndex: 'purchasePrice',
            key: 'purchasePrice',
            align: 'right' as const,
            render: (purchasePrice: number | undefined) =>
              purchasePrice !== undefined ? formatTaka(purchasePrice) : '—',
          },
        ]
      : []),
    {
      title: 'Line Total (৳)',
      dataIndex: 'lineTotal',
      key: 'lineTotal',
      align: 'right',
      render: (lineTotal: number) => formatTaka(lineTotal),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Typography.Title level={4} className="!mb-0">
          #{sale.invoiceNo}
        </Typography.Title>
        <Tag color={statusColor[sale.paymentStatus]}>{sale.paymentStatus}</Tag>
        <Typography.Text type="secondary" className="ml-auto">
          {formatDateTime(sale.saleDate)}
        </Typography.Text>
      </div>

      <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle" layout={isMobile ? 'vertical' : 'horizontal'}>
        <Descriptions.Item label="Customer">
          {sale.customer ? (
            `${sale.customer.name} (${sale.customer.phone})`
          ) : (
            <Tag>Cash Customer</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Sale Type">{sale.saleType}</Descriptions.Item>
        <Descriptions.Item label="Payment Method">
          {sale.paymentMethod ?? '— (fully due)'}
        </Descriptions.Item>
        {sale.notes && (
          <Descriptions.Item label="Note" span={2}>
            {sale.notes}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Table<SaleItemResponse>
        rowKey="id"
        columns={itemColumns}
        dataSource={sale.items}
        pagination={false}
        size="small"
        scroll={{ x: 560 }}
      />

      <div className="ml-auto w-full max-w-xs">
        <div className="flex justify-between py-1 text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-medium">{formatTaka(sale.subtotal)}</span>
        </div>
        <div className="flex justify-between py-1 text-sm">
          <span className="text-slate-500">Discount</span>
          <span className="font-medium">{formatTaka(sale.discount)}</span>
        </div>
        <div className="flex justify-between py-1 text-sm">
          <span className="text-slate-500">VAT</span>
          <span className="font-medium">{formatTaka(sale.vatTotal)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 py-2">
          <span className="font-semibold">Grand Total</span>
          <span className="font-semibold">{formatTaka(sale.grandTotal)}</span>
        </div>
        <div className="flex justify-between py-1 text-sm">
          <span className="text-slate-500">Paid</span>
          <span className="font-medium">{formatTaka(sale.paidAmount)}</span>
        </div>
        <div className="flex justify-between py-1 text-sm">
          <span className="text-slate-500">Due</span>
          <span className={sale.dueAmount > 0 ? 'font-semibold text-red-600' : 'font-medium'}>
            {formatTaka(sale.dueAmount)}
          </span>
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end border-t border-slate-200 pt-4">
          <Button danger loading={isVoiding} onClick={handleVoid}>
            Void Sale
          </Button>
        </div>
      )}
    </div>
  );
}

export default SaleDetails;
