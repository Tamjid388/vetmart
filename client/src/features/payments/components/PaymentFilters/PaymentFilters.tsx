import { Input, Select } from 'antd';
import { DEFAULT_PAYMENT_FILTERS } from '../../data/payment.constants.ts';
import type { PaymentListFilters, PaymentMethod } from '../../types/index.ts';

type PaymentFiltersProps = {
  value: PaymentListFilters;
  onChange: (next: PaymentListFilters) => void;
};

function PaymentFilters({ value, onChange }: PaymentFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
      <Input.Search
        allowClear
        placeholder="Search payments..."
        value={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value })}
        onSearch={(search) => onChange({ ...value, search })}
        className="sm:max-w-xs"
      />
      <Select<'all' | PaymentMethod>
        value={value.method}
        onChange={(method) => onChange({ ...value, method })}
        options={[
          { value: 'all', label: 'All methods' },
          { value: 'CASH', label: 'Cash' },
          { value: 'BKASH', label: 'bKash' },
          { value: 'NAGAD', label: 'Nagad' },
          { value: 'CARD', label: 'Card' },
        ]}
        className="sm:w-40"
      />
      {(value.search !== DEFAULT_PAYMENT_FILTERS.search ||
        value.method !== DEFAULT_PAYMENT_FILTERS.method) && (
        <button
          type="button"
          className="text-sm text-slate-500 underline"
          onClick={() => onChange(DEFAULT_PAYMENT_FILTERS)}
        >
          Reset
        </button>
      )}
    </div>
  );
}

export default PaymentFilters;
