import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { CustomerListFilters } from '../../types/index.ts';

type CustomerFiltersProps = {
  value: CustomerListFilters;
  onChange: (next: CustomerListFilters) => void;
};

function CustomerFilters({ value, onChange }: CustomerFiltersProps) {
  const update = (patch: Partial<CustomerListFilters>) => {
    onChange({ ...value, ...patch });
  };

  // No area dropdown: the search box already matches area
  // (CustomerSearchableFields includes 'area', insensitive contains),
  // and rural area names are unbounded free text.
  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
      <Input
        allowClear
        prefix={<SearchOutlined className="text-slate-400" />}
        placeholder="Search name/phone/area..."
        value={value.search}
        onChange={(event) => update({ search: event.target.value })}
        className="w-full max-w-xs"
      />
    </div>
  );
}

export default CustomerFilters;
