import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { VendorListFilters } from '../../types/index.ts';

type VendorFiltersProps = {
  value: VendorListFilters;
  onChange: (next: VendorListFilters) => void;
};

function VendorFilters({ value, onChange }: VendorFiltersProps) {
  const update = (patch: Partial<VendorListFilters>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
      <Input
        allowClear
        prefix={<SearchOutlined className="text-slate-400" />}
        placeholder="Search company/phone/contact..."
        value={value.search}
        onChange={(event) => update({ search: event.target.value })}
        className="w-full max-w-xs"
      />
    </div>
  );
}

export default VendorFilters;
