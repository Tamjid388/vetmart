import { useEffect } from 'react';
import { Alert, Button, Card, Form, InputNumber, Radio, Select, Typography } from 'antd';
import { useNavigate } from 'react-router';
import { CustomerSearchSelect, useCustomer } from '../../../customers/index.ts';
import { useSales } from '../../../sales/index.ts';
import { PAYMENT_METHOD_OPTIONS } from '../../data/payment.constants.ts';
import { getPaymentSubmitErrorMessage, paymentSchema } from '../../schemas/index.ts';
import type { CreatePaymentPayload, PaymentMethod } from '../../types/index.ts';
import { formatTaka } from '../../utils/format.ts';

type PaymentFormState = {
  customerId: string;
  amount: number;
  method: PaymentMethod;
  saleId?: string | null;
};

type PaymentFormProps = {
  initialCustomerId?: string | null;
  submitting?: boolean;
  serverError?: unknown;
  onSubmit: (payload: CreatePaymentPayload) => void;
  onCancel: () => void;
};

function PaymentForm({
  initialCustomerId = null,
  submitting = false,
  serverError,
  onSubmit,
  onCancel,
}: PaymentFormProps) {
  const navigate = useNavigate();
  const [form] = Form.useForm<PaymentFormState>();

  const watchedCustomerId = Form.useWatch('customerId', form) as string | undefined;
  const customerId = watchedCustomerId ?? initialCustomerId ?? null;

  useEffect(() => {
    if (initialCustomerId) {
      form.setFieldsValue({ customerId: initialCustomerId });
    }
  }, [form, initialCustomerId]);

  const { data: customer } = useCustomer(customerId ?? undefined);
  const { data: sales } = useSales({ customerId: customerId ?? '___none___', limit: 50 });
  const due = customer?.dueBalance ?? 0;
  const openSales = sales.filter((sale) => sale.dueAmount > 0);

  const handleCustomerChange = (id: string | null) => {
    form.setFieldsValue({ customerId: id ?? undefined, saleId: null });
  };

  const handleFinish = (values: PaymentFormState) => {
    onSubmit({
      customerId: values.customerId,
      amount: values.amount,
      method: values.method,
      ...(values.saleId ? { saleId: values.saleId } : {}),
    });
  };

  return (
    <Card>
      <Typography.Title level={4} className="!mb-6">
        Record Due Collection
      </Typography.Title>

      {Boolean(serverError) && (
        <Alert
          type="error"
          showIcon
          message={getPaymentSubmitErrorMessage(serverError)}
          className="mb-4"
        />
      )}

      <Form<PaymentFormState>
        form={form}
        layout="vertical"
        requiredMark
        initialValues={initialCustomerId ? { customerId: initialCustomerId, method: 'CASH' } : { method: 'CASH' }}
        onFinish={handleFinish}
      >
        <Form.Item label="Customer (required)" name="customerId" rules={paymentSchema.customerId}>
          <CustomerSearchSelect
            value={customerId}
            onChange={handleCustomerChange}
            onCreateNew={() => navigate('/customers/new')}
          />
        </Form.Item>

        {customer && (
          <div className="mb-4 text-sm">
            {due > 0 ? (
              <span className="text-red-600">
                {customer.name} owes {formatTaka(due)}
              </span>
            ) : (
              <span className="text-slate-500">
                {customer.name} has no outstanding dues — nothing to collect.
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Form.Item
            label={`Amount (max ${formatTaka(due)})`}
            name="amount"
            rules={[
              ...(paymentSchema.amount ?? []),
              {
                validator: (_, value: number | undefined) => {
                  if (value === undefined || value === null) return Promise.resolve();
                  if (value <= 0) return Promise.reject(new Error('Enter an amount greater than 0'));
                  if (due > 0 && value > due) {
                    return Promise.reject(new Error(`Collection cannot exceed due of ${formatTaka(due)}`));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              min={0.01}
              max={due > 0 ? due : undefined}
              precision={2}
              size="large"
              placeholder="e.g. 500.00"
              className="w-full"
            />
          </Form.Item>

          <Form.Item label="Linked Sale (optional)" name="saleId">
            <Select
              allowClear
              placeholder={customerId ? 'Select a due sale (optional)' : 'Select a customer first'}
              disabled={!customerId}
              options={openSales.map((sale) => ({
                value: sale.id,
                label: `#${sale.invoiceNo} — due ${formatTaka(sale.dueAmount)}`,
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
            disabled={customer !== null && due <= 0}
          >
            Record Payment
          </Button>
        </div>
      </Form>
    </Card>
  );
}

export default PaymentForm;
