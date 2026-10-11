import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Divider,
  Input,
  InputNumber,
  Radio,
  Select,
  Spin,
  Table,
  Typography,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router';
import { VendorSearchSelect } from '../../../vendors/index.ts';
import type { Vendor } from '../../../vendors/index.ts';
import { useProducts } from '../../../products/index.ts';
import { PAYMENT_METHOD_OPTIONS } from '../../data/purchase.constants.ts';
import { getPurchaseSubmitErrorMessage } from '../../schemas/purchase.schema.ts';
import type { CreatePurchasePayload, PurchasePaymentMethod } from '../../types/index.ts';
import { computeTotalsPreview, formatTaka, round2 } from '../../utils/format.ts';

export type PurchaseCartLine = {
  /** Client-side row key (one product can appear in several lots per GRN). */
  key: string;
  productId: string;
  name: string;
  unit: string;
  vatPercent: number;
  qty: number;
  purchasePrice: number;
  batchNumber: string;
  expiryDate: Dayjs | null;
  weightKg: number | null;
};

type PurchaseFormProps = {
  onSubmit: (payload: Omit<CreatePurchasePayload, 'idempotencyKey'>) => void;
  submitting?: boolean;
  serverError?: unknown;
};

function PurchaseForm({ onSubmit, submitting = false, serverError }: PurchaseFormProps) {
  const navigate = useNavigate();
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [supplier, setSupplier] = useState<Vendor | null>(null);
  const [lines, setLines] = useState<PurchaseCartLine[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PurchasePaymentMethod>('CASH');
  const [notes, setNotes] = useState('');

  const { data: products, isLoading: productsLoading } = useProducts({
    searchTerm: productSearch.trim() || undefined,
    limit: 10,
  });

  const totals = useMemo(
    () =>
      computeTotalsPreview(
        lines.map((l) => ({
          qty: l.qty,
          purchasePrice: l.purchasePrice,
          vatPercent: l.vatPercent,
        })),
        discount,
        paidAmount,
      ),
    [lines, discount, paidAmount],
  );

  const linesValid =
    lines.length > 0 &&
    lines.every(
      (l) => l.qty >= 1 && l.purchasePrice >= 0 && l.expiryDate !== null && l.expiryDate.isValid(),
    );
  const canSubmit = supplierId !== null && linesValid && !submitting;

  const handleSupplierChange = (id: string | null, selected: Vendor | null) => {
    setSupplierId(id);
    setSupplier(selected);
  };

  const handleAddProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setLines((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        unit: product.unit,
        vatPercent: product.vatPercent,
        qty: 1,
        // Prefill with the master cost (= last received lot cost).
        purchasePrice: product.purchasePrice,
        batchNumber: '',
        expiryDate: null,
        weightKg: null,
      },
    ]);
    setProductSearch('');
  };

  const patchLine = (key: string, patch: Partial<PurchaseCartLine>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const handleRemoveLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  };

  const handleSubmit = () => {
    if (!canSubmit || !supplierId) return;
    onSubmit({
      supplierId,
      items: lines.map((l) => ({
        productId: l.productId,
        qty: l.qty,
        purchasePrice: round2(l.purchasePrice),
        ...(l.batchNumber.trim() ? { batchNumber: l.batchNumber.trim() } : {}),
        expiryDate: (l.expiryDate as Dayjs).toISOString(),
        ...(l.weightKg !== null ? { weightKg: l.weightKg } : {}),
      })),
      ...(discount > 0 ? { discount } : {}),
      paymentMethod: paidAmount > 0 ? paymentMethod : null,
      paidAmount,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
  };

  const cartColumns: TableColumnsType<PurchaseCartLine> = [
    {
      title: 'Product',
      key: 'product',
      render: (_, line) => (
        <div>
          <div className="font-medium text-slate-800">{line.name}</div>
          <div className="text-xs text-slate-500">per {line.unit}</div>
        </div>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      width: 100,
      render: (qty: number, line) => (
        <InputNumber
          min={1}
          value={qty}
          onChange={(value) => value !== null && patchLine(line.key, { qty: Math.max(1, value) })}
          className="w-full"
        />
      ),
    },
    {
      title: 'Cost (৳)',
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      width: 130,
      render: (purchasePrice: number, line) => (
        <InputNumber
          min={0}
          precision={2}
          value={purchasePrice}
          onChange={(value) => value !== null && patchLine(line.key, { purchasePrice: value })}
          className="w-full"
        />
      ),
    },
    {
      title: 'Batch No',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      width: 140,
      render: (batchNumber: string, line) => (
        <Input
          placeholder="Optional"
          value={batchNumber}
          onChange={(e) => patchLine(line.key, { batchNumber: e.target.value })}
        />
      ),
    },
    {
      title: 'Expiry *',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 160,
      render: (expiryDate: Dayjs | null, line) => (
        <DatePicker
          value={expiryDate}
          onChange={(value) => patchLine(line.key, { expiryDate: value })}
          placeholder="Required"
          className="w-full"
          status={expiryDate === null ? 'error' : ''}
        />
      ),
    },
    {
      title: 'Wt (kg)',
      dataIndex: 'weightKg',
      key: 'weightKg',
      width: 100,
      render: (weightKg: number | null, line) => (
        <InputNumber
          min={0}
          precision={2}
          placeholder="—"
          value={weightKg}
          onChange={(value) => patchLine(line.key, { weightKg: value })}
          className="w-full"
        />
      ),
    },
    {
      title: 'Line Total',
      key: 'lineTotal',
      align: 'right',
      width: 120,
      render: (_, line) => formatTaka(round2(line.qty * line.purchasePrice)),
    },
    {
      title: '',
      key: 'remove',
      width: 56,
      render: (_, line) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          aria-label={`Remove ${line.name}`}
          onClick={() => handleRemoveLine(line.key)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
      <Card title="GRN Lines" className="min-w-0 flex-1">
        <div className="mb-4 flex flex-col gap-2">
          <Typography.Text strong>Supplier (required)</Typography.Text>
          <VendorSearchSelect
            value={supplierId}
            onChange={handleSupplierChange}
            onCreateNew={() => navigate('/vendors/new')}
          />
          {supplier && supplier.payableBalance > 0 && (
            <div className="mt-1 text-xs text-red-600">
              {supplier.companyName} has an outstanding payable of {formatTaka(supplier.payableBalance)}
            </div>
          )}
        </div>

        <div className="mb-4 flex flex-col gap-2">
          <Typography.Text strong>Add Product</Typography.Text>
          <Select<string>
            showSearch
            allowClear
            size="large"
            placeholder="Search product to add..."
            filterOption={false}
            searchValue={productSearch}
            onSearch={setProductSearch}
            onSelect={handleAddProduct}
            value={null}
            notFoundContent={productsLoading ? <Spin size="small" /> : 'No products found'}
            className="w-full"
            options={products.map((p) => ({
              value: p.id,
              label: `${p.name} — cost ${formatTaka(p.purchasePrice)}`,
            }))}
          />
        </div>

        <Table<PurchaseCartLine>
          rowKey="key"
          columns={cartColumns}
          dataSource={lines}
          pagination={false}
          locale={{ emptyText: 'GRN is empty — add products above' }}
          scroll={{ x: 900 }}
        />
        {lines.length > 0 && !linesValid && (
          <Typography.Text type="danger" className="mt-2 block text-xs">
            Every line needs qty ≥ 1 and a valid expiry date.
          </Typography.Text>
        )}
      </Card>

      <Card title="Payment" className="w-full xl:w-[360px] xl:shrink-0">
        {Boolean(serverError) && (
          <Alert
            type="error"
            showIcon
            message={getPurchaseSubmitErrorMessage(serverError)}
            className="mb-4"
          />
        )}

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Typography.Text type="secondary">Subtotal</Typography.Text>
            <Typography.Text strong>{formatTaka(totals.subtotal)}</Typography.Text>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Typography.Text type="secondary">Discount</Typography.Text>
            <InputNumber
              min={0}
              max={round2(totals.subtotal + totals.vatTotal)}
              size="large"
              value={discount}
              onChange={(value) => setDiscount(value ?? 0)}
              className="w-32"
            />
          </div>
          <div className="flex items-center justify-between">
            <Typography.Text type="secondary">VAT</Typography.Text>
            <Typography.Text strong>{formatTaka(totals.vatTotal)}</Typography.Text>
          </div>
          <Divider className="!my-1" />
          <div className="flex items-center justify-between">
            <Typography.Text strong>Grand Total</Typography.Text>
            <Typography.Title level={4} className="!mb-0">
              {formatTaka(totals.grandTotal)}
            </Typography.Title>
          </div>
          <div className="flex items-center justify-between gap-3">
            <Typography.Text type="secondary">Paid Amount</Typography.Text>
            <InputNumber
              min={0}
              max={totals.grandTotal}
              size="large"
              value={paidAmount}
              onChange={(value) => setPaidAmount(value ?? 0)}
              className="w-32"
            />
          </div>
          {paidAmount > 0 && (
            <div>
              <Typography.Text type="secondary">Payment Method</Typography.Text>
              <Radio.Group
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={PAYMENT_METHOD_OPTIONS}
                optionType="button"
                buttonStyle="solid"
                className="mt-1 flex flex-wrap gap-2"
              />
            </div>
          )}
          <div className="flex items-center justify-between">
            <Typography.Text type="secondary">Due</Typography.Text>
            <Typography.Text strong className={totals.dueAmount > 0 ? '!text-red-600' : ''}>
              {formatTaka(totals.dueAmount)}
            </Typography.Text>
          </div>
          <Input.TextArea
            rows={2}
            size="large"
            placeholder="Supplier challan / invoice ref (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            type="primary"
            size="large"
            block
            icon={<PlusOutlined />}
            loading={submitting}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Record Purchase
          </Button>
          {!supplierId && (
            <Typography.Text type="secondary" className="text-center text-xs">
              Select a supplier to enable GRN entry
            </Typography.Text>
          )}
        </div>
      </Card>
    </div>
  );
}

export default PurchaseForm;
