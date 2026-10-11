import { Card, Descriptions, Empty, Tag } from 'antd';
import type { Customer } from '../../types/index.ts';
import { formatArea, formatTaka } from '../../utils/format.ts';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';

type CustomerDetailsProps = {
  customer: Customer | null;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function CustomerDetails({ customer }: CustomerDetailsProps) {
  const isMobile = useIsMobile();
  if (!customer) {
    return (
      <Card>
        <Empty description="Customer not found" />
      </Card>
    );
  }

  return (
    <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle" layout={isMobile ? 'vertical' : 'horizontal'}>
      <Descriptions.Item label="Phone">{customer.phone}</Descriptions.Item>
      <Descriptions.Item label="Status">
        <Tag color={customer.isActive ? 'success' : 'default'}>
          {customer.isActive ? 'Active' : 'Inactive'}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Area">{formatArea(customer.area)}</Descriptions.Item>
      <Descriptions.Item label="Category">{customer.category ?? '—'}</Descriptions.Item>
      <Descriptions.Item label="Address" span={2}>
        {customer.address ?? '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Due Balance">
        {customer.dueBalance > 0 ? (
          <Tag color="error">Due {formatTaka(customer.dueBalance)}</Tag>
        ) : (
          <span className="text-slate-500">{formatTaka(0)} — no dues</span>
        )}
      </Descriptions.Item>
      <Descriptions.Item label="Customer Since">
        {formatDate(customer.createdAt)}
      </Descriptions.Item>
    </Descriptions>
  );
}

export default CustomerDetails;
