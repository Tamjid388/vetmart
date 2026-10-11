import { useEffect } from 'react';
import { Alert, Button, Form, InputNumber, Radio, Select, Typography } from 'antd';
import { useNavigate } from 'react-router';
import { VendorSearchSelect, useVendor } from '../../../vendors/index.ts';
import { usePurchases } from '../../../purchases/index.ts';
import { PAYMENT_METHOD_OPTIONS } from '../../data/payment.constants.ts';
import { getPaymentSubmitErrorMessage, paymentSchema } from '../../schemas/index.ts';
import type { CreatePaymentPayload, PaymentMethod } from '../../types/index.ts';
import { formatTaka } from '../../utils/format.ts';

type VendorPaymentFormState = {
  supplierId: string;
  amount: number;
  method: PaymentMethod;
  purchaseId?: string | null;
};

type VendorPaymentFormProps = {
  initialSupplierId?: string | null;
  submitting?: boolean;
  serverError?: unknown;
  onSubmit: (payload: CreatePaymentPayload) => void;
  onCancel: () => void;
};

function VendorPaymentForm({
  initialSupplierId = null,
  submitting = false,
  serverError,
  onSubmit,
  onCancel,
}: VendorPaymentFormProps) {
  const navigate = useNavigate();
  const [form] = Form.useForm<VendorPaymentFormState>();

  const watchedSupplierId = Form.useWatch('supplierId', form) as string | undefined;
  const supplierId = watchedSupplierId ?? initialSupplierId ?? null;

  useEffect(() => {
    if (initialSupplierId) {
      form.setFieldsValue({ supplierId: initialSupplierId });
    }
  }, [form, initialSupplierId]);

  const { data: supplier } = useVendor(supplierId ?? undefined);
  const { data: purchases } = usePurchases({ supplierId: supplierId ?? '___none___', limit: 50 });
  const payable = supplier?.payableBalance ?? 0;
  const openPurchases = purchases.filter((purchase) => purchase.dueAmount > 0);

  const handleSupplierChange = (id: string | null) => {
    form.setFieldsValue({ supplierId: id ?? undefined, purchaseId: null });
  };

  const handleFinish = (values: VendorPaymentFormState) => {
    onSubmit({
      supplierId: values.supplierId,
      amount: values.amount,
      method: values.method,
      ...(values.purchaseId ? { purchaseId: values.purchaseId } : {}),
    });
  };

  return (
    <div>
      <Typography.Title level={5} className="!mb-4">
        Pay Vendor
      </Typography.Title>

      {Boolean(serverError) && (
        <Alert
          type="error"
          showIcon
          message={getPaymentSubmitErrorMessage(serverError)}
          className="mb-4"
        />
      )}

      <Form<VendorPaymentFormState>
        form={form}
        layout="vertical"
        requiredMark
        initialValues={initialSupplierId ? { supplierId: initialSupplierId, method: 'CASH' } : { method: 'CASH' }}
        onFinish={handleFinish}
      >
        <Form.Item label="Supplier (required)" name="supplierId" rules={paymentSchema.supplierId}>
          <VendorSearchSelect
            value={supplierId}
            onChange={handleSupplierChange}
            onCreateNew={() => navigate('/vendors/new')}
          />
        </Form.Item>

        {supplier && (
          <div className="mb-4 text-sm">
            {payable > 0 ? (
              <span className="text-red-600">
                {supplier.companyName} is owed {formatTaka(payable)}
              </span>
            ) : (
              <span className="text-slate-500">
                {supplier.companyName} has no outstanding payable — nothing to pay.
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Form.Item
            label={`Amount (max ${formatTaka(payable)})`}
            name="amount"
            rules={[
              ...(paymentSchema.amount ?? []),
              {
                validator: (_, value: number | undefined) => {
                  if (value === undefined || value === null) return Promise.resolve();
                  if (value <= 0) return Promise.reject(new Error('Enter an amount greater than 0'));
                  if (payable > 0 && value > payable) {
                    return Promise.reject(new Error(`Payment cannot exceed payable of ${formatTaka(payable)}`));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              min={0.01}
              max={payable > 0 ? payable : undefined}
              precision={2}
              size="large"
              placeholder="e.g. 500.00"
              className="w-full"
            />
          </Form.Item>

          <Form.Item label="Linked GRN (optional)" name="purchaseId">
            <Select
              allowClear
              placeholder={supplierId ? 'Select a due GRN (optional)' : 'Select a supplier first'}
              disabled={!supplierId}
              options={openPurchases.map((purchase) => ({
                value: purchase.id,
                label: `#${purchase.invoiceNo} — due ${formatTaka(purchase.dueAmount)}`,
              }))}
            />
          </Form.Item>
        </div>

        <Form.Item label="Payment Method" name="method" rules={paymentSchema.method}>
          <Radio.Group
            options={PAYMENT_METHOD_OPTIONS}
            optionType="button"
            buttonStyle="solid"
            className="flex flex-wrap gap-2"
          />
        </Form.Item>

        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onCancel}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            disabled={supplier !== null && payable <= 0}
          >
            Record Payment
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default VendorPaymentForm;
