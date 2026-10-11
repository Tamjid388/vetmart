import { DatePicker, Input, Select } from 'antd';
import dayjs from 'dayjs';
import { AUDIT_ACTION_OPTIONS, AUDIT_MODULE_OPTIONS, DEFAULT_AUDIT_FILTERS } from '../../data/audit.constants.ts';
import type { AuditAction, AuditListFilters, AuditModule } from '../../types/index.ts';

type AuditFiltersProps = {
  value: AuditListFilters;
  onChange: (next: AuditListFilters) => void;
};

function toDayjs(value: string) {
  return value ? dayjs(value, 'YYYY-MM-DD') : null;
}

function AuditFilters({ value, onChange }: AuditFiltersProps) {
  const isDefault =
    value.search === DEFAULT_AUDIT_FILTERS.search &&
    value.module === DEFAULT_AUDIT_FILTERS.module &&
    value.action === DEFAULT_AUDIT_FILTERS.action &&
    value.dateFrom === DEFAULT_AUDIT_FILTERS.dateFrom &&
    value.dateTo === DEFAULT_AUDIT_FILTERS.dateTo;

  return (
    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
      <Input.Search
        allowClear
        placeholder="Search invoice, email, name, batch..."
        value={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value })}
        onSearch={(search) => onChange({ ...value, search })}
        className="lg:max-w-xs"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select<'all' | AuditModule>
          value={value.module}
          onChange={(module) => onChange({ ...value, module })}
          options={[{ value: 'all', label: 'All modules' }, ...AUDIT_MODULE_OPTIONS]}
          className="sm:w-40"
        />
        <Select<'all' | AuditAction>
          value={value.action}
          onChange={(action) => onChange({ ...value, action })}
          options={[{ value: 'all', label: 'All actions' }, ...AUDIT_ACTION_OPTIONS]}
          className="sm:w-44"
        />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <DatePicker
          placeholder="From date"
          value={toDayjs(value.dateFrom)}
          onChange={(_, dateString) =>
            onChange({ ...value, dateFrom: typeof dateString === 'string' ? dateString : '' })
          }
          className="sm:w-40"
        />
        <DatePicker
          placeholder="To date"
          value={toDayjs(value.dateTo)}
          onChange={(_, dateString) =>
            onChange({ ...value, dateTo: typeof dateString === 'string' ? dateString : '' })
          }
          className="sm:w-40"
        />
      </div>
      {!isDefault && (
        <button
          type="button"
          className="self-start text-sm text-slate-500 underline lg:self-center"
          onClick={() => onChange(DEFAULT_AUDIT_FILTERS)}
        >
          Reset
        </button>
      )}
    </div>
  );
}

export default AuditFilters;
