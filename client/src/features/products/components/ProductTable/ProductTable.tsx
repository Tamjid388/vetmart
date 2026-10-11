import { Button, Space, Table } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { PAGE_SIZE } from '../../data/product.constants.ts';
import type { ProductResponse } from '../../types/index.ts';
import {
  formatTaka,
  getCategoryName,
} from '../../utils/index.ts';
import { getProductStatus } from '../../utils/productStatus.ts';
import ExpiryBadge from '../ExpiryBadge/ExpiryBadge.tsx';
import StockBadge from '../StockBadge/StockBadge.tsx';

type ProductTableProps = {
  data: ProductResponse[];
  page: number;
  pageSize?: number;
  total: number;
  onPageChange: (page: number) => void;
  onView: (product: ProductResponse) => void;
  onEdit: (product: ProductResponse) => void;
  onDelete: (product: ProductResponse) => void;
  /** Cost (purchase price) is admin-only. Staff sees qty/selling only. */
  showCost?: boolean;
  /** True only on the very first load (query isPending). Full table spinner. */
  loading?: boolean;
  /** True on any background refetch (page / filter change with keepPreviousData). */
  isFetching?: boolean;
  /** True while the displayed rows are the previous page's data. */
  isPlaceholderData?: boolean;
};

function ProductStatusCell({ product }: { product: ProductResponse }) {
  const status = getProductStatus(product);
  if (status === 'Expired' || status === 'Near Expiry') {
    return <ExpiryBadge status={status} />;
  }
  return <StockBadge status={status} />;
}

function ProductTable({
  data,
  page,
  pageSize = PAGE_SIZE,
  total,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  showCost = false,
  loading = false,
  isFetching = false,
  isPlaceholderData = false,
}: ProductTableProps) {
  const columns: TableColumnsType<ProductResponse> = [
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className="font-medium text-slate-800">{name}</span>,
    },
    {
      title: 'Category',
      key: 'category',
      render: (_, product) => getCategoryName(product),
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
    },
    ...(showCost
      ? [
          {
            title: 'Purchase (৳)',
            dataIndex: 'purchasePrice',
            key: 'purchasePrice',
            align: 'right' as const,
            render: (value: number) => formatTaka(value),
          },
        ]
      : []),
    {
      title: 'Selling (৳)',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      align: 'right',
      render: (value: number) => formatTaka(value),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, product) => <ProductStatusCell product={product} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, product) => (
        <Space size={10}>
          <Button
            size="middle"
            icon={<EyeOutlined />}
            aria-label={`View ${product.name}`}
            onClick={() => onView(product)}
          />
          <Button
            size="middle"
            icon={<EditOutlined />}
            aria-label={`Edit ${product.name}`}
            onClick={() => onEdit(product)}
          />
          <Button
            size="middle"
            danger
            icon={<DeleteOutlined />}
            aria-label={`Delete ${product.name}`}
            onClick={() => onDelete(product)}
          />
        </Space>
      ),
    },
  ];

  // With placeholderData: keepPreviousData, `data` still holds the previous
  // page while the next one loads. Only spin the whole table on the initial
  // load; dim it during background refetches so the UI never flashes empty.
  const showStaleDim = !loading && (isPlaceholderData || isFetching);

  return (
    <div className={showStaleDim ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      <Table<ProductResponse>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1200 }}
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
    </div>
  );
}

export default ProductTable;
