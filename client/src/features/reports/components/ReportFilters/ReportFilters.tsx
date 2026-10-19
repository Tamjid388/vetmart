import { DatePicker, Input } from 'antd';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';

type ReportFiltersProps = {
  search: string;
  onSearchChange: (search: string) => void;
  searchPlaceholder?: string;
  dateFrom: string;
  dateTo: string;
  onDateChange: (dateFrom: string, dateTo: string) => void;
  hideDates?: boolean;
  extra?: ReactNode;
  onReset: () => void;
  showReset: boolean;
};

function toDayjs(value: string) {
  return value ? dayjs(value, 'YYYY-MM-DD') : null;
}

function ReportFilters({
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
  dateFrom,
  dateTo,
  onDateChange,
  hideDates = false,
  extra,
  onReset,
  showReset,
}: ReportFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
      <Input.Search
        allowClear
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        onSearch={onSearchChange}
        className="lg:max-w-xs"
      />
      {!hideDates && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DatePicker
            placeholder="From date"
            value={toDayjs(dateFrom)}
            onChange={(_, dateString) =>
              onDateChange(typeof dateString === 'string' ? dateString : '', dateTo)
            }
            className="sm:w-40"
          />
          <DatePicker
            placeholder="To date"
            value={toDayjs(dateTo)}
            onChange={(_, dateString) =>
              onDateChange(dateFrom, typeof dateString === 'string' ? dateString : '')
            }
            className="sm:w-40"
          />
        </div>
      )}
      {extra}
      {showReset && (
        <button
          type="button"
          className="self-start text-sm text-slate-500 underline lg:self-center"
          onClick={onReset}
        >
          Reset
        </button>
      )}
    </div>
  );
}

export default ReportFilters;
