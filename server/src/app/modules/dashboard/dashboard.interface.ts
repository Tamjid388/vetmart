import type { TUserRole } from '../users/user.constant.js';

export type TDashboardRole = TUserRole;

export type TDashboardKpi = {
  id: string;
  title: string;
  value: number;
  changePercent: number;
  goodWhen: 'up' | 'down';
};

export type TDashboardSalesPoint = {
  label: string;
  sales: number;
};

export type TDashboardPurchaseSalesPoint = {
  label: string;
  purchase: number;
  sales: number;
};

export type TDashboardDueProgressItem = {
  id: string;
  label: string;
  collected: number;
  total: number;
  color: 'green' | 'orange';
};

export type TDashboardLowStockRow = {
  id: string;
  name: string;
  minStock: number;
  stock: number;
  status: 'Low Stock' | 'Critical';
};

export type TDashboardExpiryRow = {
  id: string;
  name: string;
  /** YYYY-MM-DD */
  expiryDate: string;
  status: 'Near Expiry' | 'Expired';
};

export type TDashboardSummary = {
  kpis: TDashboardKpi[];
  salesByPeriod: {
    today: TDashboardSalesPoint[];
    week: TDashboardSalesPoint[];
    month: TDashboardSalesPoint[];
  };
  purchaseVsSales: TDashboardPurchaseSalesPoint[];
  dueProgress: TDashboardDueProgressItem[];
  lowStock: TDashboardLowStockRow[];
  expiryAlerts: TDashboardExpiryRow[];
};
