import { App, Button, Card, Descriptions, Empty, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { useNavigate } from 'react-router';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';
import { getApiErrorMessage } from '../../../../lib/axios/axios.ts';
import { usePurchaseMutations } from '../../hooks/usePurchaseMutations/index.ts';
import type {
  PurchaseItemResponse,
  PurchasePaymentStatus,
  PurchaseResponse,
} from '../../types/index.ts';
import { formatDate, formatDateTime, formatTaka } from '../../utils/format.ts';

const statusColor: Record<PurchasePaymentStatus, string> = {
  PAID: 'success',
  PARTIAL: 'orange',
  DUE: 'error',
};

type PurchaseDetailsProps = {
  purchase: PurchaseResponse | null;
};

/** GRN receipt view — module is admin-only, so lot costs always render. */
function PurchaseDetails({ purchase }: PurchaseDetailsProps) {
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const isMobile = useIsMobile();
  const { voidPurchase, isVoiding } = usePurchaseMutations();

  const handleVoid = () => {
    if (!purchase) return;
    modal.confirm({
      title: 'Void purchase',
      content: `Void GRN #${purchase.invoiceNo}? Lots will be un-received and the payable of ${formatTaka(purchase.dueAmount)} reversed. Blocked if any goods were already sold. This cannot be undone.`,
      okText: 'Void Purchase',
      okType: 'danger',
      okButtonProps: { loading: isVoiding },
      onOk: () => {
        voidPurchase(purchase.id, {
          onSuccess: () => {
            message.success(`Purchase #${purchase.invoiceNo} voided`);
            navigate('/purchases');
          },
          onError: (error) => {
            message.error(getApiErrorMessage(error, 'Failed to void purchase'));
          },
        });
      },
    });
  };

  if (!purchase) {
    return (
      <Card>
        <Empty description="Purchase not found" />
      </Card>
    );
  }

  const itemColumns: TableColumnsType<PurchaseItemResponse> = [
    {
      title: 'Product',
      key: 'product',
      render: (_, item) => (
        <div>
          <div className="font-medium text-slate-800">{item.product?.name ?? item.productId}</div>
          <div className="text-xs text-slate-500">
            {item.batch?.batchNumber ? `Lot ${item.batch.batchNumber}` : 'No lot info'}
            {item.expiryDate ? ` · exp ${formatDate(item.expiryDate)}` : ''}
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Typography.Title level={4} className="!mb-0">
          #{purchase.invoiceNo}
        </Typography.Title>
        <Tag color={statusColor[purchase.paymentStatus]}>{purchase.paymentStatus}</Tag>
        <Typography.Text type="secondary" className="ml-auto">
          {formatDateTime(purchase.purchaseDate)}
        </Typography.Text>
      </div>

      <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle" layout={isMobile ? 'vertical' : 'horizontal'}>
        <Descriptions.Item label="Supplier">
          {purchase.supplier
            ? `${purchase.supplier.companyName} (${purchase.supplier.phone})`
            : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Payment Method">
          {purchase.paymentMethod ?? '— (fully due)'}
        </Descriptions.Item>
        {purchase.notes && (
          <Descriptions.Item label="Note" span={2}>
            {purchase.notes}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Table<PurchaseItemResponse>
        rowKey="id"
        columns={itemColumns}
        dataSource={purchase.items}
        pagination={false}
        size="small"
        scroll={{ x: 560 }}
      />

      <div className="ml-auto w-full max-w-xs">
        <div className="flex justify-between py-1 text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-medium">{formatTaka(purchase.subtotal)}</span>
        </div>
        <div className="flex justify-between py-1 text-sm">
          <span className="text-slate-500">Discount</span>
          <span className="font-medium">{formatTaka(purchase.discount)}</span>
        </div>
        <div className="flex justify-between py-1 text-sm">
          <span className="text-slate-500">VAT</span>
          <span className="font-medium">{formatTaka(purchase.vatTotal)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 py-2">
          <span className="font-semibold">Grand Total</span>
          <span className="font-semibold">{formatTaka(purchase.grandTotal)}</span>
        </div>
        <div className="flex justify-between py-1 text-sm">
          <span className="text-slate-500">Paid</span>
          <span className="font-medium">{formatTaka(purchase.paidAmount)}</span>
        </div>
        <div className="flex justify-between py-1 text-sm">
          <span className="text-slate-500">Due</span>
          <span className={purchase.dueAmount > 0 ? 'font-semibold text-red-600' : 'font-medium'}>
            {formatTaka(purchase.dueAmount)}
          </span>
        </div>
      </div>

      <div className="flex justify-end border-t border-slate-200 pt-4">
        <Button danger loading={isVoiding} onClick={handleVoid}>
          Void Purchase
        </Button>
      </div>
    </div>
  );
}

export default PurchaseDetails;
