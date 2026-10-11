import { Button, Space, Table, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { PAGE_SIZE } from '../../data/customer.constants.ts';
import type { Customer } from '../../types/index.ts';
import { formatArea, formatTaka } from '../../utils/format.ts';

type CustomerTableProps = {
  data: Customer[];
  page: number;
  pageSize?: number;
  total: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
};

function CustomerTable({
  data,
  page,
  pageSize = PAGE_SIZE,
  total,
  isLoading = false,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: CustomerTableProps) {
  const columns: TableColumnsType<Customer> = [
    {
      title: 'Customer Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className="font-medium text-slate-800">{name}</span>,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => <span className="whitespace-nowrap">{phone}</span>,
    },
    {
      title: 'Area',
      dataIndex: 'area',
      key: 'area',
      render: (area: string | null) => formatArea(area),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string | null) => category ?? '—',
    },
    {
      title: 'Due (৳)',
      dataIndex: 'dueBalance',
      key: 'dueBalance',
      align: 'right',
      render: (dueBalance: number) =>
        dueBalance > 0 ? (
          <Tag color="error">Due {formatTaka(dueBalance)}</Tag>
        ) : (
          <span className="text-slate-400">{formatTaka(0)}</span>
        ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, customer) => (
        <Space size={10}>
          <Button
            size="middle"
            icon={<EyeOutlined />}
            aria-label={`View ${customer.name}`}
            onClick={() => onView(customer)}
          />
          <Button
            size="middle"
            icon={<EditOutlined />}
            aria-label={`Edit ${customer.name}`}
            onClick={() => onEdit(customer)}
          />
          <Button
            size="middle"
            danger
            icon={<DeleteOutlined />}
            aria-label={`Delete ${customer.name}`}
            onClick={() => onDelete(customer)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Table<Customer>
      rowKey="id"
      loading={isLoading}
      columns={columns}
      dataSource={data}
      scroll={{ x: 1000 }}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: false,
        onChange: onPageChange,
        showTotal: (entryTotal, range) =>
          `Showing ${range[0]} to ${range[1]} of ${entryTotal} entries`,
      }}
    />
  );
}

export default CustomerTable;
