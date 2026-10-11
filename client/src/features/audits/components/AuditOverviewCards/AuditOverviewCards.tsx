import { Card, Col, Row, Skeleton, Table, Typography } from 'antd';
import type { AuditOverview } from '../../types/index.ts';
import { formatTaka } from '../../utils/format.ts';

const { Text } = Typography;

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <Text type="secondary">{label}</Text>
      <Text strong>{value}</Text>
    </div>
  );
}

type AuditOverviewCardsProps = {
  overview: AuditOverview | null;
  loading?: boolean;
};

function AuditOverviewCards({ overview, loading = false }: AuditOverviewCardsProps) {
  if (loading || !overview) {
    return (
      <Row gutter={[16, 16]}>
        {[0, 1, 2, 3].map((key) => (
          <Col key={key} xs={24} sm={12} lg={6}>
            <Card>
              <Skeleton active paragraph={{ rows: 3 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card title="Sales (বিক্রি)" size="small">
            <StatRow label="Recorded" value={String(overview.sales.total)} />
            <StatRow label="Voided" value={String(overview.sales.voided)} />
            <StatRow label="Total" value={formatTaka(overview.sales.grandTotal)} />
            <StatRow label="Outstanding due" value={formatTaka(overview.sales.dueTotal)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title="Purchases (ক্রয়)" size="small">
            <StatRow label="Recorded" value={String(overview.purchases.total)} />
            <StatRow label="Voided" value={String(overview.purchases.voided)} />
            <StatRow label="Total" value={formatTaka(overview.purchases.grandTotal)} />
            <StatRow label="Outstanding payable" value={formatTaka(overview.purchases.dueTotal)} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title="Payments (পেমেন্ট)" size="small">
            <StatRow label="Collections" value={String(overview.payments.total)} />
            <StatRow label="Amount" value={formatTaka(overview.payments.amountTotal)} />
            <StatRow
              label="From customers"
              value={`${overview.payments.customer.count} • ${formatTaka(overview.payments.customer.amount)}`}
            />
            <StatRow
              label="To suppliers"
              value={`${overview.payments.supplier.count} • ${formatTaka(overview.payments.supplier.amount)}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card title="Stock & Users" size="small">
            <StatRow label="Stock movements" value={String(overview.stock.total)} />
            <StatRow
              label="Purchase / Sale / Return"
              value={`${overview.stock.byType.PURCHASE ?? 0} / ${overview.stock.byType.SALE ?? 0} / ${overview.stock.byType.RETURN ?? 0}`}
            />
            <StatRow
              label="Users"
              value={`${overview.users.total} (${overview.users.admins} admin)`}
            />
            <StatRow
              label="Customer / Supplier / Product"
              value={`${overview.masters.customers} / ${overview.masters.suppliers} / ${overview.masters.products}`}
            />
          </Card>
        </Col>
      </Row>
      {overview.topActors.length > 0 && (
        <Card title="Most active users (সক্রিয় ব্যবহারকারী)" size="small">
          <Table
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ x: 560 }}
            dataSource={overview.topActors}
            columns={[
              {
                title: 'User',
                key: 'user',
                render: (_, actor) => (
                  <div>
                    <div className="font-medium text-slate-800">{actor.name ?? actor.email ?? '—'}</div>
                    {actor.name && <div className="text-xs text-slate-500">{actor.email}</div>}
                  </div>
                ),
              },
              { title: 'Sales', dataIndex: 'sales', key: 'sales', align: 'right' },
              { title: 'Purchases', dataIndex: 'purchases', key: 'purchases', align: 'right' },
              { title: 'Payments', dataIndex: 'payments', key: 'payments', align: 'right' },
            ]}
          />
        </Card>
      )}
    </div>
  );
}

export default AuditOverviewCards;
