import { Card, Skeleton } from 'antd';
import { formatTaka } from '../../utils/index.ts';
import type { ReportOverview } from '../../types/index.ts';

type OverviewCard = {
  label: string;
  value: string;
  sub?: string;
};

function ReportOverviewCards({ overview, loading }: { overview: ReportOverview | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} size="small">
            <Skeleton active paragraph={{ rows: 1 }} />
          </Card>
        ))}
      </div>
    );
  }

  if (!overview) return null;

  const cards: OverviewCard[] = [
    {
      label: 'Sales',
      value: formatTaka(overview.sales.grandTotal),
      sub: `${overview.sales.count} invoices • due ${formatTaka(overview.sales.dueTotal)}`,
    },
    {
      label: 'Purchases',
      value: formatTaka(overview.purchases.grandTotal),
      sub: `${overview.purchases.count} GRNs • due ${formatTaka(overview.purchases.dueTotal)}`,
    },
    {
      label: 'Gross Profit (FIFO)',
      value: formatTaka(overview.profit.grossProfit),
      sub: `revenue ${formatTaka(overview.profit.revenue)} • COGS ${formatTaka(overview.profit.cogs)}`,
    },
    {
      label: 'Customer Due',
      value: formatTaka(overview.dues.customerDue),
      sub: `${overview.dues.customerCount} customers owe`,
    },
    {
      label: 'Vendor Due',
      value: formatTaka(overview.dues.vendorDue),
      sub: `${overview.dues.vendorCount} suppliers owed`,
    },
    {
      label: 'Stock Value (lot cost)',
      value: formatTaka(overview.stock.stockValue),
      sub: `${overview.stock.products} products • ${overview.stock.criticalCount} critical, ${overview.stock.lowCount} low`,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label} size="small" className="border-slate-200">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {card.label}
          </p>
          <p className="mt-1 truncate text-xl font-semibold tabular-nums text-slate-900">{card.value}</p>
          {card.sub && <p className="mt-1 truncate text-xs text-slate-400">{card.sub}</p>}
        </Card>
      ))}
    </div>
  );
}

export default ReportOverviewCards;
