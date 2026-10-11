import type { SalesPeriod } from '../types/index.ts';

export const ALERT_LIMIT = 6;

export const SALES_PERIOD_OPTIONS: { label: string; value: SalesPeriod }[] = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

export const CHART_COLORS = {
  sales: '#16A34A',
  purchase: '#F97316',
  grid: '#E2E8F0',
  axis: '#94A3B8',
} as const;
