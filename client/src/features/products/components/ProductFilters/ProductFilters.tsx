import { Button, Input, Select } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { DEFAULT_PRODUCT_FILTERS } from '../../data/product.constants.ts';
import type { ProductListFilters } from '../../types/product.types.ts';
// import type { ProductListFilters } from '../../types/index.ts';

type ProductFiltersProps = {
  value: ProductListFilters;
  onChange: (next: ProductListFilters) => void;
  /** Desktop: wrapped row with labeled reset. Mobile-chips: full-width search + scrollable pill row. */
  variant?: 'desktop' | 'mobile-chips';
};

function isDefaultFilters(value: ProductListFilters) {
  return (
    value.search === DEFAULT_PRODUCT_FILTERS.search &&
    value.stockStatus === DEFAULT_PRODUCT_FILTERS.stockStatus &&
    value.expiry === DEFAULT_PRODUCT_FILTERS.expiry
  );
}

function ProductFilters({ value, onChange, variant = 'desktop' }: ProductFiltersProps) {
  const update = (patch: Partial<ProductListFilters>) => {
    onChange({ ...value, ...patch });
  };

  const stockSelect = (
    <Select
      value={value.stockStatus}
      onChange={(stockStatus) => update({ stockStatus })}
      className={variant === 'mobile-chips' ? 'min-w-32 shrink-0' : 'w-44'}
      options={[
        { value: 'all', label: 'Stock: All Statuses' },
        { value: 'In Stock', label: 'In Stock' },
        { value: 'Low Stock', label: 'Low Stock' },
        { value: 'Critical', label: 'Critical' },
      ]}
    />
  );
  const expirySelect = (
    <Select
      value={value.expiry}
      onChange={(expiry) => update({ expiry })}
      className={variant === 'mobile-chips' ? 'min-w-32 shrink-0' : 'w-44'}
      options={[
        { value: 'active', label: 'Expiry: Active Only' },
        { value: 'all', label: 'Expiry: All' },
        { value: 'near', label: 'Near Expiry' },
        { value: 'expired', label: 'Expired' },
      ]}
    />
  );

  if (variant === 'mobile-chips') {
    return (
      <div className="flex min-w-0 flex-col gap-2">
        <Input
          allowClear
          prefix={<SearchOutlined className="text-slate-400" />}
          placeholder="Search product name..."
          value={value.search}
          onChange={(event) => update({ search: event.target.value })}
          className="w-full"
        />
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
          {stockSelect}
          {expirySelect}
          <Button
            icon={<ReloadOutlined />}
            aria-label="Reset Filters"
            disabled={isDefaultFilters(value)}
            onClick={() => onChange(DEFAULT_PRODUCT_FILTERS)}
            className="shrink-0"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
      <Input
        allowClear
        prefix={<SearchOutlined className="text-slate-400" />}
        placeholder="Search product name..."
        value={value.search}
        onChange={(event) => update({ search: event.target.value })}
        className="w-full max-w-xs"
      />
      {stockSelect}
      {expirySelect}
      <Button
        icon={<ReloadOutlined />}
        disabled={isDefaultFilters(value)}
        onClick={() => onChange(DEFAULT_PRODUCT_FILTERS)}
      >
        Reset Filters
      </Button>
    </div>
  );
}

export default ProductFilters;
