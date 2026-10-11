import { Alert, Descriptions, Drawer, Skeleton, Table, Tag } from 'antd';
import type { AuditEvent, AuditEventDetail } from '../../types/index.ts';
import { formatDateTime, formatTaka } from '../../utils/format.ts';
import { moduleColor, severityColor, statusColor } from '../../utils/auditUi.ts';
import { useIsMobile } from '../../../../layouts/appLayout/index.ts';

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return value.toLocaleString('en-BD');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') {
    // ISO timestamps render as readable date/time; everything else as-is.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return formatDateTime(value);
    return value;
  }
  return JSON.stringify(value);
}

function toMoneyLabel(key: string, value: unknown): string {
  if (typeof value !== 'number') return formatValue(value);
  return /amount|total|price|balance|discount|vat|due|payable/i.test(key)
    ? formatTaka(value)
    : formatValue(value);
}

type AuditDetailDrawerProps = {
  open: boolean;
  event: AuditEvent | null;
  detail: AuditEventDetail | null;
  loading?: boolean;
  onClose: () => void;
};

function StockBeforeAfter({ event }: { event: AuditEvent }) {
  const before = event.details.stockBefore;
  const after = event.details.stockAfter;
  const delta = event.details.qtyDelta;
  if (typeof before !== 'number' || typeof after !== 'number') return null;
  return (
    <Alert
      type={event.severity === 'critical' ? 'error' : event.severity === 'warning' ? 'warning' : 'info'}
      showIcon
      message={`Stock before vs after: ${before} → ${after}`}
      description={`Change ${typeof delta === 'number' && delta > 0 ? `+${delta}` : String(delta ?? '—')} • type ${String(event.details.type ?? '—')}`}
    />
  );
}

function RecordItems({ detail }: { detail: AuditEventDetail }) {
  const record = detail.record;
  const items = record.items;
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-slate-700">Lines</div>
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ x: 520 }}
        dataSource={items as Record<string, unknown>[]}
        columns={[
          {
            title: 'Product',
            key: 'product',
            render: (_, item) => {
              const product = item.product as { name?: string } | null | undefined;
              return <span>{product?.name ?? String(item.productId ?? '—')}</span>;
            },
          },
          { title: 'Qty', dataIndex: 'qty', key: 'qty', align: 'right' },
          {
            title: 'Price (৳)',
            key: 'price',
            align: 'right',
            render: (_, item) =>
              formatTaka(Number(item.purchasePrice ?? item.sellingPrice ?? 0)),
          },
          {
            title: 'Line total (৳)',
            key: 'lineTotal',
            align: 'right',
            render: (_, item) => formatTaka(Number(item.lineTotal ?? 0)),
          },
        ]}
      />
    </div>
  );
}

function AuditDetailDrawer({ open, event, detail, loading = false, onClose }: AuditDetailDrawerProps) {
  const isMobile = useIsMobile();
  const shown = detail?.event ?? event;

  return (
    <Drawer
      title="Audit event details"
      open={open}
      onClose={onClose}
      width={isMobile ? '100%' : 560}
    >
      {loading || !shown ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 text-base font-medium text-slate-800">{shown.title}</div>
            <div className="flex flex-wrap gap-1">
              <Tag color={moduleColor[shown.module]} className="capitalize">
                {shown.module}
              </Tag>
              <Tag className="capitalize">{shown.action}</Tag>
              {shown.status && <Tag color={statusColor(shown.status)}>{shown.status}</Tag>}
              <Tag color={severityColor[shown.severity]}>{shown.severity}</Tag>
            </div>
          </div>

          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Summary">{shown.summary}</Descriptions.Item>
            <Descriptions.Item label="Date / Time">{formatDateTime(shown.eventAt)}</Descriptions.Item>
            <Descriptions.Item label="User">
              {shown.actor
                ? `${shown.actor.name ?? shown.actor.email ?? shown.actor.id}`
                : '— (not stored for this record)'}
            </Descriptions.Item>
            <Descriptions.Item label="Record ref">{shown.refNo}</Descriptions.Item>
          </Descriptions>

          <StockBeforeAfter event={shown} />

          <Descriptions bordered column={1} size="small" title="Stored fields">
            {Object.entries(shown.details).map(([key, value]) => (
              <Descriptions.Item key={key} label={key}>
                {toMoneyLabel(key, value)}
              </Descriptions.Item>
            ))}
          </Descriptions>

          {detail && <RecordItems detail={detail} />}

          {detail && typeof detail.record.notes === 'string' && detail.record.notes && (
            <Alert
              type="info"
              showIcon
              message="Record note"
              description={detail.record.notes}
            />
          )}
        </div>
      )}
    </Drawer>
  );
}

export default AuditDetailDrawer;
