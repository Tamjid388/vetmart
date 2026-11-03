import { useState } from 'react';
import { DatePicker, Select, Spin } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useSupplierDropdown } from '../../../vendors/hooks/useSupplierDropdown/index.ts';
import type { VendorLedgerFiltersValue } from '../../types/index.ts';

const { RangePicker } = DatePicker;

type VendorLedgerFiltersProps = {
  value: VendorLedgerFiltersValue;
  onChange: (next: VendorLedgerFiltersValue) => void;
};

function toISODate(d: Dayjs): string {
  return d.format('YYYY-MM-DD');
}

function VendorLedgerFilters({ value, onChange }: VendorLedgerFiltersProps) {
  const [supplierSearch, setSupplierSearch] = useState('');
  const { data: suppliers, isLoading: suppliersLoading } = useSupplierDropdown({
    searchTerm: supplierSearch.trim() || undefined,
    limit: 20,
  });

  const rangeValue: [Dayjs, Dayjs] | null =
    value.dateFrom && value.dateTo ? [dayjs(value.dateFrom), dayjs(value.dateTo)] : null;

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
      <Select
        showSearch
        allowClear
        placeholder="Select vendor..."
        value={value.supplierId || undefined}
        onChange={(supplierId) => onChange({ ...value, supplierId: supplierId || undefined })}
        onSearch={setSupplierSearch}
        filterOption={false}
        loading={suppliersLoading}
        notFoundContent={suppliersLoading ? <Spin size="small" /> : 'No vendors found'}
        options={suppliers.map((s) => ({
          value: s.id,
          label: `${s.companyName} (${s.phone})`,
        }))}
        className="w-full max-w-xs"
      />
      <RangePicker
        value={rangeValue}
        onChange={(dates) => {
          if (!dates || !dates[0] || !dates[1]) {
            onChange({ ...value, dateFrom: undefined, dateTo: undefined });
          } else {
            onChange({ ...value, dateFrom: toISODate(dates[0]), dateTo: toISODate(dates[1]) });
          }
        }}
      />
    </div>
  );
}

export default VendorLedgerFilters;
