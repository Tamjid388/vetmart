import type { ExpiryStatus, StockStatus } from '../../products/types/index.ts';

export type SalesPeriod = 'today' | 'week' | 'month';

export type KpiGoodWhen = 'up' | 'down';

export type DashboardKpi = {
  id: string;
  title: string;
  value: number;
  changePercent: number;
  goodWhen: KpiGoodWhen;
};

export type SalesPoint = {
  label: string;
  sales: number;
};

export type PurchaseSalesPoint = {
  label: string;
  purchase: number;
  sales: number;
};

export type DueProgressItem = {
  id: string;
  label: string;
  collected: number;
  total: number;
  color: 'green' | 'orange';
};

export type LowStockAlertRow = {
  id: string;
  name: string;
  minStock: number;
  stock: number;
  status: Exclude<StockStatus, 'In Stock'>;
};

export type ExpiryAlertRow = {
  id: string;
  name: string;
  expiryDate: string;
  status: Exclude<ExpiryStatus, 'Active'>;
};

export type DashboardData = {
  kpis: DashboardKpi[];
  salesByPeriod: Record<SalesPeriod, SalesPoint[]>;
  purchaseVsSales: PurchaseSalesPoint[];
  dueProgress: DueProgressItem[];
  lowStock: LowStockAlertRow[];
  expiryAlerts: ExpiryAlertRow[];
};

export type Dashboard = DashboardData;
