import { Button, Table, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { PAGE_SIZE } from '../../data/audit.constants.ts';
import type { AuditEvent } from '../../types/index.ts';
import { formatDateTime } from '../../utils/format.ts';
import { actionColor, moduleColor, severityColor, statusColor } from '../../utils/auditUi.ts';

type AuditTableProps = {
  data: AuditEvent[];
  page: number;
  pageSize?: number;
  total: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onView: (event: AuditEvent) => void;
};

function AuditTable({
  data,
  page,
  pageSize = PAGE_SIZE,
  total,
  isLoading = false,
  onPageChange,
  onView,
}: AuditTableProps) {
  const columns: TableColumnsType<AuditEvent> = [
    {
      title: 'Date / Time',
      dataIndex: 'eventAt',
      key: 'eventAt',
      render: (eventAt: string) => (
        <span className="whitespace-nowrap">{formatDateTime(eventAt)}</span>
      ),
    },
    {
      title: 'Module',
      dataIndex: 'module',
      key: 'module',
      render: (module: AuditEvent['module']) => (
        <Tag color={moduleColor[module]} className="capitalize">
          {module}
        </Tag>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: AuditEvent['action']) => (
        <Tag color={actionColor[action]} className="capitalize">
          {action}
        </Tag>
      ),
    },
    {
      title: 'Record',
      dataIndex: 'refNo',
      key: 'refNo',
      render: (refNo: string, event) => (
        <div>
          <div className="font-medium text-slate-800">{event.title}</div>
          <div className="text-xs text-slate-500">{refNo}</div>
        </div>
      ),
    },
    {
      title: 'User',
      key: 'actor',
      render: (_, event) => (
        <span className="text-slate-600">
          {event.actor?.name ?? event.actor?.email ?? '—'}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, event) => (
        <div className="flex flex-col gap-1">
          {event.status && <Tag color={statusColor(event.status)}>{event.status}</Tag>}
          <Tag color={severityColor[event.severity]}>{event.severity}</Tag>
        </div>
      ),
    },
    {
      title: 'Details',
      key: 'view',
      align: 'right',
      render: (_, event) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => onView(event)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <Table<AuditEvent>
      rowKey="id"
      loading={isLoading}
      columns={columns}
      dataSource={data}
      scroll={{ x: 980 }}
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

export default AuditTable;
