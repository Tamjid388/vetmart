import { Card, Descriptions, Empty, Tag } from 'antd';
import type { Vendor } from '../../types/index.ts';
import { formatTaka } from '../../utils/format.ts';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';

type VendorDetailsProps = {
  vendor: Vendor | null;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function VendorDetails({ vendor }: VendorDetailsProps) {
  const isMobile = useIsMobile();
  if (!vendor) {
    return (
      <Card>
        <Empty description="Supplier not found" />
      </Card>
    );
  }

  return (
    <Descriptions bordered column={{ xs: 1, sm: 2 }} size="middle" layout={isMobile ? 'vertical' : 'horizontal'}>
      <Descriptions.Item label="Contact Person">{vendor.contactPerson ?? '—'}</Descriptions.Item>
      <Descriptions.Item label="Phone">{vendor.phone}</Descriptions.Item>
      <Descriptions.Item label="Status">
        <Tag color={vendor.isActive ? 'success' : 'default'}>
          {vendor.isActive ? 'Active' : 'Inactive'}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Payment Terms">
        {vendor.paymentTerms != null ? `Net ${vendor.paymentTerms} days` : '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Address" span={2}>
        {vendor.address ?? '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Trade License">{vendor.tradeLicense ?? '—'}</Descriptions.Item>
      <Descriptions.Item label="Outstanding">
        {vendor.payableBalance > 0 ? (
          <Tag color="warning">Payable {formatTaka(vendor.payableBalance)}</Tag>
        ) : (
          <span className="text-slate-500">{formatTaka(0)} — settled</span>
        )}
      </Descriptions.Item>
      <Descriptions.Item label="Supplier Since" span={2}>
        {formatDate(vendor.createdAt)}
      </Descriptions.Item>
    </Descriptions>
  );
}

export default VendorDetails;
