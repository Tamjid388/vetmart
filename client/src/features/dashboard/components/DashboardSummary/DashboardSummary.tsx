import {
  DollarOutlined,
  FundOutlined,
  InboxOutlined,
  RiseOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import type { DashboardKpi } from '../../types/index.ts';
import { StatCard, type StatLayout, type StatTone } from '../StatCard/index.ts';

const kpiIcons: Record<string, ReactNode> = {
  sales: <RiseOutlined />,
  purchase: <ShoppingCartOutlined />,
  collection: <WalletOutlined />,
  due: <FundOutlined />,
  customerDue: <TeamOutlined />,
  vendorDue: <ShopOutlined />,
  stockValue: <InboxOutlined />,
  profit: <DollarOutlined />,
};

type KpiMeta = {
  tone: StatTone;
  layout?: StatLayout;
  caption?: string;
};

const KPI_META: Record<string, KpiMeta> = {
  sales: { tone: 'green', caption: 'vs yesterday' },
  purchase: { tone: 'orange', caption: 'vs yesterday' },
  collection: { tone: 'cyan', caption: 'vs yesterday' },
  due: { tone: 'amber', caption: 'vs yesterday' },
  profit: { tone: 'green', caption: 'vs yesterday' },
  customerDue: { tone: 'amber', layout: 'ledger', caption: 'outstanding total' },
  vendorDue: { tone: 'orange', layout: 'ledger', caption: 'payable total' },
  stockValue: { tone: 'slate', layout: 'ledger', caption: 'on hand' },
};

const TODAY_IDS = ['sales', 'purchase', 'collection', 'due', 'profit'];
const POSITION_IDS = ['customerDue', 'vendorDue', 'stockValue'];

function GroupLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
      {children}
    </p>
  );
}

function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const meta = KPI_META[kpi.id] ?? { tone: 'slate' as StatTone };
  return (
    <StatCard
      kpi={kpi}
      icon={kpiIcons[kpi.id] ?? <FundOutlined />}
      tone={meta.tone}
      layout={meta.layout}
      caption={meta.caption}
    />
  );
}

type DashboardSummaryProps = {
  kpis: DashboardKpi[];
};

function DashboardSummary({ kpis }: DashboardSummaryProps) {
  const byId = new Map(kpis.map((kpi) => [kpi.id, kpi]));
  const pick = (ids: string[]) =>
    ids.map((id) => byId.get(id)).filter((kpi): kpi is DashboardKpi => kpi !== undefined);
  const known = new Set([...TODAY_IDS, ...POSITION_IDS]);
  const rest = kpis.filter((kpi) => !known.has(kpi.id));

  const today = [...pick(TODAY_IDS), ...rest.filter((kpi) => (KPI_META[kpi.id]?.layout ?? 'flow') === 'flow')];
  const position = [
    ...pick(POSITION_IDS),
    ...rest.filter((kpi) => KPI_META[kpi.id]?.layout === 'ledger'),
  ];

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Today">
        <GroupLabel>Today</GroupLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {today.map((kpi) => (
            <KpiCard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </section>

      {position.length > 0 && (
        <section aria-label="Outstanding and stock">
          <GroupLabel>Outstanding &amp; stock</GroupLabel>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {position.map((kpi) => (
              <KpiCard key={kpi.id} kpi={kpi} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default DashboardSummary;
