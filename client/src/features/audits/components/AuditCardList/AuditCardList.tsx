import { Button, Card, List, Tag } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { PAGE_SIZE } from '../../data/audit.constants.ts';
import type { AuditEvent } from '../../types/index.ts';
import { formatDateTime } from '../../utils/format.ts';
import { actionColor, moduleColor, severityColor } from '../../utils/auditUi.ts';

type AuditCardListProps = {
  data: AuditEvent[];
  page: number;
  pageSize?: number;
  total: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onView: (event: AuditEvent) => void;
};

function AuditCardList({
  data,
  page,
  pageSize = PAGE_SIZE,
  total,
  loading = false,
  onPageChange,
  onView,
}: AuditCardListProps) {
  return (
    <List
      loading={loading}
      dataSource={data}
      renderItem={(event) => (
        <List.Item className="!px-0">
          <Card size="small" className="w-full" title={event.title}>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-1">
                <Tag color={moduleColor[event.module]} className="capitalize">
                  {event.module}
                </Tag>
                <Tag color={actionColor[event.action]} className="capitalize">
                  {event.action}
                </Tag>
                <Tag color={severityColor[event.severity]}>{event.severity}</Tag>
              </div>
              <div className="text-sm text-slate-600">{event.summary}</div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{event.actor?.name ?? event.actor?.email ?? 'System'}</span>
                <span>{formatDateTime(event.eventAt)}</span>
              </div>
              <Button
                type="link"
                icon={<EyeOutlined />}
                className="!px-0 self-start"
                onClick={() => onView(event)}
              >
                View details
              </Button>
            </div>
          </Card>
        </List.Item>
      )}
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

export default AuditCardList;
