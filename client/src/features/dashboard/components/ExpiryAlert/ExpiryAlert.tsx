import { Card, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { ExpiryBadge } from '../../../products/components/ExpiryBadge/index.ts';
import { formatExpiryDate } from '../../../products/utils/format.ts';
import type { ExpiryAlertRow } from '../../types/index.ts';

type ExpiryAlertProps = {
  data: ExpiryAlertRow[];
};

const columns: TableColumnsType<ExpiryAlertRow> = [
  {
    title: 'Product',
    dataIndex: 'name',
    key: 'name',
    render: (name: string) => <span className="font-medium text-slate-800">{name}</span>,
  },
  {
    title: 'Expiry Date',
    dataIndex: 'expiryDate',
    key: 'expiryDate',
    width: 130,
    render: (value: string) => formatExpiryDate(value),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    render: (status: ExpiryAlertRow['status']) => <ExpiryBadge status={status} />,
  },
];

function ExpiryAlert({ data }: ExpiryAlertProps) {
  return (
    <Card className="shadow-sm">
      <Typography.Title level={5} className="!mb-4">
        Near Expiry / Expired Meds
      </Typography.Title>
      <Table<ExpiryAlertRow>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={data}
        pagination={false}
        locale={{ emptyText: 'No expiry alerts' }}
      />
    </Card>
  );
}

export default ExpiryAlert;
