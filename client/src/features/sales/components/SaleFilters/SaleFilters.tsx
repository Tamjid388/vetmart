import { Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { SaleListFilters, SalePaymentStatus, SaleType } from '../../types/index.ts';

type SaleFiltersProps = {
  value: SaleListFilters;
  onChange: (next: SaleListFilters) => void;
};

function SaleFilters({ value, onChange }: SaleFiltersProps) {
  const update = (patch: Partial<SaleListFilters>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
      <Input
        allowClear
        prefix={<SearchOutlined className="text-slate-400" />}
        placeholder="Search invoice no..."
        value={value.search}
        onChange={(event) => update({ search: event.target.value })}
        className="w-full max-w-xs"
      />
      <Select<SalePaymentStatus | 'all'>
        value={value.paymentStatus}
        onChange={(paymentStatus) => update({ paymentStatus })}
        className="w-44"
        options={[
          { value: 'all', label: 'Status: All' },
          { value: 'PAID', label: 'Status: Paid' },
          { value: 'PARTIAL', label: 'Status: Partial' },
          { value: 'DUE', label: 'Status: Due' },
        ]}
      />
      <Select<SaleType | 'all'>
        value={value.saleType}
        onChange={(saleType) => update({ saleType })}
        className="w-44"
        aria-label="Filter by sale type"
        options={[
          { value: 'all', label: 'Type: All' },
          { value: 'REGISTERED', label: 'Type: Registered' },
          { value: 'CASH', label: 'Type: Cash' },
        ]}
      />
    </div>
  );
}

export default SaleFilters;
