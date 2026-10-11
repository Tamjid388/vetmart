import { AutoComplete, Button, Card, Form, Input, Modal, Select, Switch, Typography } from 'antd';
import { CUSTOMER_CATEGORIES } from '../../data/customer.constants.ts';
import { useCustomerAreas } from '../../hooks/useCustomerAreas/index.ts';
import { customerSchema } from '../../schemas/customer.schema.ts';
import type { Customer, CustomerCategory, CustomerFormValues } from '../../types/index.ts';
import { formatArea } from '../../utils/index.ts';

type CustomerFormProps = {
  mode: 'create' | 'edit';
  initialValues?: Customer;
  submitting?: boolean;
  onSubmit: (values: CustomerFormValues) => void;
  onCancel: () => void;
};

function toFormValues(customer?: Customer): Partial<CustomerFormValues> {
  if (!customer) {
    return { isActive: true };
  }

  return {
    name: customer.name,
    phone: customer.phone,
    address: customer.address ?? undefined,
    // Stored lowercase ("mirpur") — show display form ("Mirpur").
    // handleFinish normalizes back before submit, so this is lossless.
    area: customer.area ? formatArea(customer.area) : undefined,
    category: (customer.category as CustomerCategory | null) ?? undefined,
    isActive: customer.isActive,
  };
}

const optionalTrimmed = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

/** Same canonical form the server stores (normalizeArea): trim + single spaces + lowercase. */
const normalizeAreaInput = (value: string | undefined): string | undefined => {
  const collapsed = value?.trim().replace(/\s+/g, ' ');
  if (!collapsed) return undefined;
  return collapsed.toLowerCase();
};

function CustomerForm({
  mode,
  initialValues,
  submitting = false,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const [form] = Form.useForm<CustomerFormValues>();
  const isEdit = mode === 'edit';
  // DB-driven suggestions (free-text rural names allowed — list is a
  // suggestion, not a lock). keepPreviousData keeps old options visible.
  const { areas, isPending: areasLoading } = useCustomerAreas();

  const submit = (area: string | undefined, values: CustomerFormValues) => {
    onSubmit({
      name: values.name.trim(),
      phone: values.phone.trim(),
      address: optionalTrimmed(values.address),
      area,
      category: values.category,
      isActive: values.isActive ?? true,
    });
  };

  const handleFinish = (values: CustomerFormValues) => {
    const area = normalizeAreaInput(values.area);
    // New area (not in DB list) needs one explicit confirmation —
    // this is the main typo guard for free-text rural names.
    if (area && !areas.includes(area)) {
      Modal.confirm({
        title: 'Add new area?',
        content: `"${formatArea(area)}" is not in the area list. Save it as a new area?`,
        okText: 'Add area',
        cancelText: 'Cancel',
        onOk: () => submit(area, values),
      });
      return;
    }
    submit(area, values);
  };

  return (
    <Card>
      <Typography.Title level={4} className="!mb-6">
        {isEdit ? 'Edit Customer' : 'Add Customer'}
      </Typography.Title>

      <Form<CustomerFormValues>
        form={form}
        layout="vertical"
        requiredMark
        initialValues={toFormValues(initialValues)}
        onFinish={handleFinish}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Form.Item label="Customer Name" name="name" rules={customerSchema.name}>
            <Input placeholder="e.g. Anisul Haque" />
          </Form.Item>
          <Form.Item label="Phone" name="phone" rules={customerSchema.phone}>
            <Input placeholder="e.g. 01711-482910" />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Form.Item label="Area" name="area">
            <AutoComplete
              allowClear
              placeholder={areasLoading ? 'Loading areas...' : 'Type or select area'}
              options={areas.map((area) => ({ value: area, label: formatArea(area) }))}
              notFoundContent="No areas yet — type to add the first one"
            />
          </Form.Item>
          <Form.Item label="Category" name="category">
            <Select
              allowClear
              placeholder="Select category"
              options={CUSTOMER_CATEGORIES.map((category) => ({
                value: category,
                label: category,
              }))}
            />
          </Form.Item>
        </div>

        <Form.Item label="Address" name="address">
          <Input.TextArea rows={3} placeholder="House, road, area" />
        </Form.Item>

        <Form.Item label="Active" name="isActive" valuePropName="checked">
          <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
        </Form.Item>

        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={submitting}>
            {isEdit ? 'Save Changes' : 'Save Customer'}
          </Button>
        </div>
      </Form>
    </Card>
  );
}

export default CustomerForm;
