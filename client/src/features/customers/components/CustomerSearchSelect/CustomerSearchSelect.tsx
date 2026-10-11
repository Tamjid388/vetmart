import { useState } from 'react';
import { Button, Divider, Select, Space, Spin, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useCustomers } from '../../hooks/useCustomers/index.ts';
import type { Customer } from '../../types/index.ts';
import { formatTaka } from '../../utils/format.ts';

type CustomerSearchSelectProps = {
  value?: string | null;
  onChange: (customerId: string | null, customer: Customer | null) => void;
  placeholder?: string;
  /** Called with the current search text when staff wants to create a missing customer inline (E4 POS). */
  onCreateNew?: (search: string) => void;
  disabled?: boolean;
};

/**
 * POS-ready customer lookup: remote search by name/phone with an inline-create
 * entry point. E4 (Sale) reuses this inside the checkout flow.
 */
function CustomerSearchSelect({
  value,
  onChange,
  placeholder = 'Search customer by name or phone',
  onCreateNew,
  disabled = false,
}: CustomerSearchSelectProps) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useCustomers({
    searchTerm: search.trim() || undefined,
    limit: 10,
  });

  const handleSelect = (customerId: string) => {
    const customer = data.find((item) => item.id === customerId) ?? null;
    onChange(customerId, customer);
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
      notFoundContent={isLoading ? <Spin size="small" /> : 'No customers found'}
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
                  Create new customer{search.trim() ? ` for “${search.trim()}”` : ''}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      options={data.map((customer) => ({
        value: customer.id,
        label: (
          <Space className="w-full justify-between">
            <Typography.Text>
              {customer.name}{' '}
              <Typography.Text type="secondary">{customer.phone}</Typography.Text>
            </Typography.Text>
            {customer.dueBalance > 0 && (
              <Tag color="error" className="!mr-0">
                Due {formatTaka(customer.dueBalance)}
              </Tag>
            )}
          </Space>
        ),
      }))}
    />
  );
}

export default CustomerSearchSelect;
