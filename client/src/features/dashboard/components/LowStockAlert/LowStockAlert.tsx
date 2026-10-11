import { Card, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { StockBadge } from '../../../products/components/StockBadge/index.ts';
import type { LowStockAlertRow } from '../../types/index.ts';

type LowStockAlertProps = {
  data: LowStockAlertRow[];
};

const columns: TableColumnsType<LowStockAlertRow> = [
  {
    title: 'Product',
    dataIndex: 'name',
    key: 'name',
    render: (name: string) => <span className="font-medium text-slate-800">{name}</span>,
  },
  {
    title: 'Min Qty',
    dataIndex: 'minStock',
    key: 'minStock',
    align: 'right',
    width: 90,
  },
  {
    title: 'Stock',
    dataIndex: 'stock',
    key: 'stock',
    align: 'right',
    width: 80,
    render: (stock: number, row) => (
      <span className={row.status === 'Critical' ? 'font-semibold text-red-500' : 'text-slate-700'}>
        {stock}
      </span>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 110,
    render: (status: LowStockAlertRow['status']) => <StockBadge status={status} />,
  },
];

function LowStockAlert({ data }: LowStockAlertProps) {
  return (
    <Card className="shadow-sm">
      <Typography.Title level={5} className="!mb-4">
        Low Stock Products Alert
      </Typography.Title>
      <Table<LowStockAlertRow>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={data}
        pagination={false}
        locale={{ emptyText: 'No low-stock products' }}
      />
    </Card>
  );
}

export default LowStockAlert;
