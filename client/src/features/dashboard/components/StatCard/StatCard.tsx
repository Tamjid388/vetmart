import type { ReactNode } from 'react';
import { Card } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import type { DashboardKpi } from '../../types/index.ts';
import { formatChangePercent, formatTaka } from '../../utils/format.ts';

export type StatTone = 'green' | 'cyan' | 'orange' | 'amber' | 'slate';

export type StatLayout = 'flow' | 'ledger';

const TONE_TILE: Record<StatTone, string> = {
  green: 'bg-green-50 text-green-700',
  cyan: 'bg-cyan-50 text-cyan-700',
  orange: 'bg-orange-50 text-orange-600',
  amber: 'bg-amber-50 text-amber-700',
  slate: 'bg-slate-100 text-slate-600',
};

type StatCardProps = {
  kpi: DashboardKpi;
  icon: ReactNode;
  tone?: StatTone;
  layout?: StatLayout;
  caption?: string;
};

function TrendPill({ kpi }: { kpi: DashboardKpi }) {
  const isUp = kpi.changePercent >= 0;
  const isHealthy = kpi.goodWhen === 'up' ? isUp : !isUp;
  const tone = isHealthy ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${tone}`}
    >
      {isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
      {formatChangePercent(kpi.changePercent)}
    </span>
  );
}

function StatCard({
  kpi,
  icon,
  tone = 'slate',
  layout = 'flow',
  caption,
}: StatCardProps) {
  if (layout === 'ledger') {
    return (
      <Card size="small" className="border-slate-200 transition-colors hover:border-slate-300">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-base ${TONE_TILE[tone]}`}
          >
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              {kpi.title}
            </p>
            <p className="truncate text-xl font-semibold tabular-nums text-slate-900">
              {formatTaka(kpi.value)}
            </p>
          </div>
          <TrendPill kpi={kpi} />
        </div>
        {caption && <p className="mt-1 pl-12 text-xs text-slate-400">{caption}</p>}
      </Card>
    );
  }

  return (
    <Card
      size="small"
      className="border-slate-200 transition-colors hover:border-slate-300"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          {kpi.title}
        </p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-base ${TONE_TILE[tone]}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-1 truncate text-[22px] font-semibold leading-8 tabular-nums text-slate-900">
        {formatTaka(kpi.value)}
      </p>
      <div className="mt-1.5 flex items-center gap-1.5">
        <TrendPill kpi={kpi} />
        {caption && <span className="text-[11px] text-slate-400">{caption}</span>}
      </div>
    </Card>
  );
}

export default StatCard;
