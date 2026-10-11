import { Button, Card, Form, Input, InputNumber, Switch, Typography } from 'antd';
import { vendorSchema } from '../../schemas/vendor.schema.ts';
import type { Vendor, VendorFormValues } from '../../types/index.ts';

type VendorFormProps = {
  mode: 'create' | 'edit';
  initialValues?: Vendor;
  submitting?: boolean;
  onSubmit: (values: VendorFormValues) => void;
  onCancel: () => void;
};

function toFormValues(vendor?: Vendor): Partial<VendorFormValues> {
  if (!vendor) {
    return { isActive: true };
  }

  return {
    companyName: vendor.companyName,
    contactPerson: vendor.contactPerson ?? undefined,
    phone: vendor.phone,
    address: vendor.address ?? undefined,
    tradeLicense: vendor.tradeLicense ?? undefined,
    paymentTerms: vendor.paymentTerms ?? undefined,
    isActive: vendor.isActive,
  };
}

const optionalTrimmed = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

function VendorForm({
  mode,
  initialValues,
  submitting = false,
  onSubmit,
  onCancel,
}: VendorFormProps) {
  const [form] = Form.useForm<VendorFormValues>();
  const isEdit = mode === 'edit';

  const handleFinish = (values: VendorFormValues) => {
    onSubmit({
      companyName: values.companyName.trim(),
      contactPerson: optionalTrimmed(values.contactPerson),
      phone: values.phone.trim(),
      address: optionalTrimmed(values.address),
      tradeLicense: optionalTrimmed(values.tradeLicense),
      paymentTerms: values.paymentTerms ?? undefined,
      isActive: values.isActive ?? true,
    });
  };

  return (
    <Card>
      <Typography.Title level={4} className="!mb-6">
        {isEdit ? 'Edit Supplier' : 'Add Supplier'}
      </Typography.Title>

      <Form<VendorFormValues>
        form={form}
        layout="vertical"
        requiredMark
        initialValues={toFormValues(initialValues)}
        onFinish={handleFinish}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Form.Item label="Company Name" name="companyName" rules={vendorSchema.companyName}>
            <Input placeholder="e.g. ACI Animal Health" />
          </Form.Item>
          <Form.Item label="Contact Person" name="contactPerson">
            <Input placeholder="e.g. Md. Karim" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Form.Item label="Phone" name="phone" rules={vendorSchema.phone}>
            <Input placeholder="e.g. 01811-223344" />
          </Form.Item>
          <Form.Item label="Trade License" name="tradeLicense">
            <Input placeholder="e.g. TRAD-2024-1187" />
          </Form.Item>
        </div>

        <Form.Item label="Address" name="address">
          <Input.TextArea rows={3} placeholder="Office, road, area" />
        </Form.Item>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Form.Item
            label="Payment Terms (days)"
            name="paymentTerms"
            tooltip="Net payment days, e.g. 30 = net-30"
          >
            <InputNumber className="w-full" min={0} placeholder="e.g. 30" />
          </Form.Item>
          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            {isEdit ? 'Save Changes' : 'Save Supplier'}
          </Button>
        </div>
      </Form>
    </Card>
  );
}

export default VendorForm;
