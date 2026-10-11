import { Button, Space, Table, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { PAGE_SIZE } from '../../data/vendor.constants.ts';
import type { Vendor } from '../../types/index.ts';
import { formatTaka } from '../../utils/format.ts';

type VendorTableProps = {
  data: Vendor[];
  page: number;
  pageSize?: number;
  total: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onView: (vendor: Vendor) => void;
  onEdit: (vendor: Vendor) => void;
  onDelete: (vendor: Vendor) => void;
};

function VendorTable({
  data,
  page,
  pageSize = PAGE_SIZE,
  total,
  isLoading = false,
  onPageChange,
  onView,
  onEdit,
  onDelete,
}: VendorTableProps) {
  const columns: TableColumnsType<Vendor> = [
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
      render: (companyName: string) => (
        <span className="font-medium text-slate-800">{companyName}</span>
      ),
    },
    {
      title: 'Contact Person',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      render: (contactPerson: string | null) => contactPerson ?? '—',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => <span className="whitespace-nowrap">{phone}</span>,
    },
    {
      title: 'Outstanding (৳)',
      dataIndex: 'payableBalance',
      key: 'payableBalance',
      align: 'right',
      render: (payableBalance: number) =>
        payableBalance > 0 ? (
          <Tag color="warning">Payable {formatTaka(payableBalance)}</Tag>
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
      render: (_, vendor) => (
        <Space size={10}>
          <Button
            size="middle"
            icon={<EyeOutlined />}
            aria-label={`View ${vendor.companyName}`}
            onClick={() => onView(vendor)}
          />
          <Button
            size="middle"
            icon={<EditOutlined />}
            aria-label={`Edit ${vendor.companyName}`}
            onClick={() => onEdit(vendor)}
          />
          <Button
            size="middle"
            danger
            icon={<DeleteOutlined />}
            aria-label={`Delete ${vendor.companyName}`}
            onClick={() => onDelete(vendor)}
          />
        </Space>
      ),
    },
  ];

  return (
    <Table<Vendor>
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

export default VendorTable;
