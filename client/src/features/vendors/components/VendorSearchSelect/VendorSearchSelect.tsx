import { useState } from 'react';
import { Button, Divider, Select, Space, Spin, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useVendors } from '../../hooks/useVendors/index.ts';
import type { Vendor } from '../../types/index.ts';
import { formatTaka } from '../../utils/format.ts';

type VendorSearchSelectProps = {
  value?: string | null;
  onChange: (supplierId: string | null, supplier: Vendor | null) => void;
  placeholder?: string;
  /** Called with the current search text when staff wants to create a missing supplier inline. */
  onCreateNew?: (search: string) => void;
  disabled?: boolean;
};

/**
 * GRN-ready supplier lookup: remote search by company/contact/phone with an
 * inline-create entry point. E6 (Purchase) reuses this inside the GRN flow.
 */
function VendorSearchSelect({
  value,
  onChange,
  placeholder = 'Search supplier by company or phone',
  onCreateNew,
  disabled = false,
}: VendorSearchSelectProps) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useVendors({
    searchTerm: search.trim() || undefined,
    limit: 10,
  });

  const handleSelect = (supplierId: string) => {
    const supplier = data.find((item) => item.id === supplierId) ?? null;
    onChange(supplierId, supplier);
  };

  const handleClear = () => {
    onChange(null, null);
  };

  return (
    <Select<string>
      showSearch
      allowClear
      size="large"
      value={value ?? undefined}
      placeholder={placeholder}
      disabled={disabled}
      filterOption={false}
      searchValue={search}
      onSearch={setSearch}
      onSelect={handleSelect}
      onClear={handleClear}
      notFoundContent={isLoading ? <Spin size="small" /> : 'No suppliers found'}
      dropdownRender={(menu) => (
        <div>
          {menu}
          {onCreateNew && (
            <>
              <Divider className="!my-2" />
              <div className="px-2 pb-1">
                <Button
                  type="dashed"
                  block
                  icon={<PlusOutlined />}
                  onClick={() => onCreateNew(search.trim())}
                >
                  Create new supplier{search.trim() ? ` for “${search.trim()}”` : ''}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      options={data.map((supplier) => ({
        value: supplier.id,
        label: (
          <Space className="w-full justify-between">
            <Typography.Text>
              {supplier.companyName}{' '}
              <Typography.Text type="secondary">{supplier.phone}</Typography.Text>
            </Typography.Text>
            {supplier.payableBalance > 0 && (
              <Tag color="error" className="!mr-0">
                Payable {formatTaka(supplier.payableBalance)}
              </Tag>
            )}
          </Space>
        ),
      }))}
    />
  );
}

export default VendorSearchSelect;
