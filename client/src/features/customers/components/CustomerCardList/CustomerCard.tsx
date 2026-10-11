import { Button, Card, Space, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import type { Customer } from '../../types/index.ts';
import { formatArea, formatTaka } from '../../utils/format.ts';

type CustomerCardProps = {
  customer: Customer;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
};

/** Mobile customer card — same fields as the desktop table row, no data fetching. */
function CustomerCard({ customer, onView, onEdit, onDelete }: CustomerCardProps) {
  return (
    <Card size="small" className="w-full">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-800">{customer.name}</div>
          <div className="truncate text-xs text-slate-500">{customer.phone}</div>
        </div>
        <Tag color={customer.isActive ? 'success' : 'default'} className="shrink-0">
          {customer.isActive ? 'Active' : 'Inactive'}
        </Tag>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Area</div>
          <div className="truncate text-slate-800">{formatArea(customer.area)}</div>
        </div>
        <div className="min-w-0">
          <div className="text-[11px] text-slate-500">Category</div>
          <div className="truncate text-slate-800">{customer.category ?? '—'}</div>
        </div>
        <div className="col-span-2 min-w-0">
          <div className="text-[11px] text-slate-500">Due</div>
          {customer.dueBalance > 0 ? (
            <Tag color="error">Due {formatTaka(customer.dueBalance)}</Tag>
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
            aria-label={`View ${customer.name}`}
            onClick={() => onView(customer)}
          />
          <Button
            size="middle"
            icon={<EditOutlined />}
            aria-label={`Edit ${customer.name}`}
            onClick={() => onEdit(customer)}
          />
          <Button
            size="middle"
            danger
            icon={<DeleteOutlined />}
            aria-label={`Delete ${customer.name}`}
            onClick={() => onDelete(customer)}
          />
        </Space>
      </div>
    </Card>
  );
}

export default CustomerCard;
