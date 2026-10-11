import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Divider,
  Input,
  InputNumber,
  Radio,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
} from 'antd';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { useNavigate } from 'react-router';
import { CustomerSearchSelect } from '../../../customers/index.ts';
import type { Customer } from '../../../customers/index.ts';
import { useProducts } from '../../../products/index.ts';
import type { ProductResponse } from '../../../products/types/index.ts';
import { PAYMENT_METHOD_OPTIONS } from '../../data/sale.constants.ts';
import { getSaleSubmitErrorMessage, getShortStockLines } from '../../schemas/sale.schema.ts';
import type { CreateSalePayload, SalePaymentMethod, SaleType } from '../../types/index.ts';
import { computeTotalsPreview, formatTaka, round2 } from '../../utils/format.ts';

export type SaleCartLine = {
  productId: string;
  name: string;
  unit: string;
  sellingPrice: number;
  vatPercent: number;
  available: number;
  qty: number;
};

type SaleFormProps = {
  onSubmit: (payload: Omit<CreateSalePayload, 'idempotencyKey'>) => void;
  submitting?: boolean;
  serverError?: unknown;
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Unexpired on-hand units — what FIFO can actually consume. */
function availableOf(product: ProductResponse): number {
  const today = startOfToday();
  return (product.batches ?? [])
    .filter((b) => b.stock > 0 && (b.expiryDate === null || new Date(b.expiryDate) >= today))
    .reduce((sum, b) => sum + b.stock, 0);
}

function SaleForm({ onSubmit, submitting = false, serverError }: SaleFormProps) {
  const navigate = useNavigate();
  const [saleType, setSaleType] = useState<SaleType>('REGISTERED');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [lines, setLines] = useState<SaleCartLine[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<SalePaymentMethod>('CASH');
  const [notes, setNotes] = useState('');

  const isCash = saleType === 'CASH';

  const { data: products, isLoading: productsLoading } = useProducts({
    searchTerm: productSearch.trim() || undefined,
    limit: 10,
  });

  // Cash sales settle in full: derive paid = grand total during render
  // (no effect/setState loop — grandTotal never depends on paidAmount).
  const totals = useMemo(() => {
    const mapped = lines.map((l) => ({
      qty: l.qty,
      sellingPrice: l.sellingPrice,
      vatPercent: l.vatPercent,
    }));
    const grandTotal = computeTotalsPreview(mapped, discount, 0).grandTotal;
    return computeTotalsPreview(mapped, discount, isCash ? grandTotal : paidAmount);
  }, [lines, discount, paidAmount, isCash]);

  const shortLines = getShortStockLines(serverError);
  const canSubmit = (isCash || customerId !== null) && lines.length > 0 && !submitting;

  const handleCustomerChange = (id: string | null, selected: Customer | null) => {
    setCustomerId(id);
    setCustomer(selected);
  };

  const handleAddProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) =>
          l.productId === productId
            ? { ...l, qty: Math.min(l.qty + 1, Math.max(l.available, 1)) }
            : l,
        );
      }
      const available = availableOf(product);
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unit: product.unit,
          sellingPrice: product.sellingPrice,
          vatPercent: product.vatPercent,
          available,
          qty: 1,
        },
      ];
    });
    setProductSearch('');
  };

  const handleQtyChange = (productId: string, qty: number | null) => {
    if (qty === null) return;
    setLines((prev) =>
      prev.map((l) => (l.productId === productId ? { ...l, qty: Math.max(1, qty) } : l)),
    );
  };

  const handleRemoveLine = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (isCash) {
      // No customer info for cash sales; paid always equals the bill.
      onSubmit({
        saleType: 'CASH',
        items: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
        ...(discount > 0 ? { discount } : {}),
        paymentMethod: 'CASH',
        paidAmount: totals.grandTotal,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      return;
    }
    if (!customerId) return;
    onSubmit({
      saleType: 'REGISTERED',
      customerId,
      items: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
      ...(discount > 0 ? { discount } : {}),
      paymentMethod: paidAmount > 0 ? paymentMethod : null,
      paidAmount,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
  };

  const cartColumns: TableColumnsType<SaleCartLine> = [
    {
      title: 'Product',
      key: 'product',
      render: (_, line) => (
        <div>
          <div className="font-medium text-slate-800">{line.name}</div>
          <div className="text-xs text-slate-500">
            {formatTaka(line.sellingPrice)} / {line.unit} · avail {line.available}
          </div>
        </div>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'qty',
      key: 'qty',
      width: 130,
      render: (qty: number, line) => (
        <InputNumber
          min={1}
          max={Math.max(line.available, 1)}
          size="large"
          value={qty}
          onChange={(value) => handleQtyChange(line.productId, value)}
          className="w-full"
        />
      ),
    },
    {
      title: 'Line Total',
      key: 'lineTotal',
      align: 'right',
      width: 130,
      render: (_, line) => formatTaka(round2(line.qty * line.sellingPrice)),
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
          onClick={() => handleRemoveLine(line.productId)}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
      <Card title="Sale Cart" className="min-w-0 flex-1">
        <div className="mb-4 flex flex-col gap-2">
          <Typography.Text strong>Sale type</Typography.Text>
          <Radio.Group
            value={saleType}
            onChange={(e) => setSaleType(e.target.value)}
            options={[
              { value: 'REGISTERED', label: 'Registered' },
              { value: 'CASH', label: 'Cash customer' },
            ]}
            optionType="button"
            buttonStyle="solid"
            aria-label="Sale type"
          />
        </div>

        {isCash ? (
          <Alert
            type="info"
            showIcon
            message="Cash customer — full cash payment. No customer info needed, no due allowed."
            className="mb-4"
          />
        ) : (
          <div className="mb-4 flex flex-col gap-2">
            <Typography.Text strong>Customer (required)</Typography.Text>
            <CustomerSearchSelect
              value={customerId}
              onChange={handleCustomerChange}
              onCreateNew={() => navigate('/customers/new')}
            />
            {customer && customer.dueBalance > 0 && (
              <div className="mt-1 text-xs text-red-600">
                {customer.name} has an outstanding due of {formatTaka(customer.dueBalance)}
              </div>
            )}
          </div>
        )}

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
              label: `${p.name} — avail ${availableOf(p)} — ${formatTaka(p.sellingPrice)}`,
            }))}
          />
        </div>

        <Table<SaleCartLine>
          rowKey="productId"
          columns={cartColumns}
          dataSource={lines}
          pagination={false}
          locale={{ emptyText: 'Cart is empty — add products above' }}
          scroll={{ x: 560 }}
        />
      </Card>

      <Card title="Payment" className="w-full xl:w-[360px] xl:shrink-0">
        {Boolean(serverError) && (
          <Alert
            type="error"
            showIcon
            message={getSaleSubmitErrorMessage(serverError)}
            description={
              shortLines.length > 0 && (
                <ul className="mt-1 list-disc pl-4">
                  {shortLines.map((line) => (
                    <li key={line.productId}>
                      {line.productName}: need {line.requested}, have {line.available}
                      {line.expiredOnly ? ' (expired stock only)' : ''}
                    </li>
                  ))}
                </ul>
              )
            }
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
              disabled={isCash}
              onChange={(value) => setPaidAmount(value ?? 0)}
              className="w-32"
            />
          </div>
          {isCash ? (
            <div>
              <Typography.Text type="secondary">Payment Method</Typography.Text>
              <div className="mt-1">
                <Tag color="gold">Cash (fixed)</Tag>
              </div>
            </div>
          ) : (
            paidAmount > 0 && (
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
            )
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
            placeholder="Counter note (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            type="primary"
            size="large"
            block
            icon={<ShoppingCartOutlined />}
            loading={submitting}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Complete Sale
          </Button>
          {!isCash && !customerId && (
            <Typography.Text type="secondary" className="text-center text-xs">
              Select a customer to enable checkout
            </Typography.Text>
          )}
        </div>
      </Card>
    </div>
  );
}

export default SaleForm;
