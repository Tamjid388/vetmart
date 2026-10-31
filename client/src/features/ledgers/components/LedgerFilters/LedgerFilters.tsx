import { DatePicker, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useCustomerAreas } from '../../../customers/hooks/useCustomerAreas/index.ts';
import type { LedgerFiltersValue } from '../../types/index.ts';

const { RangePicker } = DatePicker;

type LedgerFiltersProps = {
  value: LedgerFiltersValue;
  onChange: (next: LedgerFiltersValue) => void;
};

function toISODate(d: Dayjs): string {
  return d.format('YYYY-MM-DD');
}

function LedgerFilters({ value, onChange }: LedgerFiltersProps) {
  const { areas } = useCustomerAreas();

  const rangeValue: [Dayjs, Dayjs] | null =
    value.dateFrom && value.dateTo ? [dayjs(value.dateFrom), dayjs(value.dateTo)] : null;

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
      <Input
        allowClear
        prefix={<SearchOutlined className="text-slate-400" />}
        placeholder="Search customer name..."
        value={value.name}
        onChange={(event) => onChange({ ...value, name: event.target.value })}
        className="w-full max-w-xs"
      />
      <Select
        allowClear
        placeholder="All areas"
        value={value.area || undefined}
        onChange={(area) => onChange({ ...value, area: area || undefined })}
        options={areas.map((area) => ({ value: area, label: area }))}
        className="w-full max-w-xs"
        showSearch
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

export default LedgerFilters;
