import { Button, Card, Space, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import type { Vendor } from '../../types/index.ts';
import { formatTaka } from '../../utils/format.ts';

type VendorCardProps = {
  vendor: Vendor;
  onView: (vendor: Vendor) => void;
  onEdit: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
};

/** Mobile supplier card — same fields as the desktop table row, no data fetching. */
function VendorCard({ vendor, onView, onEdit, onDelete }: VendorCardProps) {
  return (
    <Card size="small" className="w-full">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-800">{vendor.companyName}</div>
          <div className="truncate text-xs text-slate-500">{vendor.phone}</div>
        </div>
        <Tag color={vendor.isActive ? 'success' : 'default'} className="shrink-0">
          {vendor.isActive ? 'Active' : 'Inactive'}
        </Tag>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Contact Person</div>
          <div className="truncate text-slate-800">{vendor.contactPerson ?? '—'}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Phone</div>
          <div className="truncate text-slate-800">{vendor.phone}</div>
        </div>
        <div className="col-span-2 min-w-0">
          <div className="text-[11px] text-slate-500">Outstanding</div>
          {vendor.payableBalance > 0 ? (
            <Tag color="warning">Payable {formatTaka(vendor.payableBalance)}</Tag>
          ) : (
            <span className="text-slate-400">{formatTaka(0)}</span>
          )}
        </div>
      </div>

      <div className="mt-2 flex justify-end border-t border-slate-100 pt-2">
        <Space size={8}>
          <Button
            size="middle"
            icon={<EyeOutlined />}
            aria-label={`View ${vendor.companyName}`}
            onClick={() => onView(vendor)}
          />
          <Button
            size="middle"
            icon={<EditOutlined />}
            aria-label={`Edit ${vendor.companyName}`}
            onClick={() => onEdit(vendor)}
          />
          <Button
            size="middle"
            danger
            icon={<DeleteOutlined />}
            aria-label={`Delete ${vendor.companyName}`}
            onClick={() => onDelete(vendor)}
          />
        </Space>
      </div>
    </Card>
  );
}

export default VendorCard;
