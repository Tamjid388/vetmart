import { Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { PurchaseListFilters, PurchasePaymentStatus } from '../../types/index.ts';

type PurchaseFiltersProps = {
  value: PurchaseListFilters;
  onChange: (next: PurchaseListFilters) => void;
};

function PurchaseFilters({ value, onChange }: PurchaseFiltersProps) {
  const update = (patch: Partial<PurchaseListFilters>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
      <Input
        allowClear
        prefix={<SearchOutlined className="text-slate-400" />}
        placeholder="Search GRN no..."
        value={value.search}
        onChange={(event) => update({ search: event.target.value })}
        className="w-full max-w-xs"
      />
      <Select<PurchasePaymentStatus | 'all'>
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
    </div>
  );
}

export default PurchaseFilters;
