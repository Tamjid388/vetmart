import { useMemo } from 'react';
import { useProducts } from '../../../products/hooks/useProducts/index.ts';
import {
  dashboardKpis,
  dueProgress,
  purchaseVsSales,
  salesByPeriod,
} from '../../data/dashboard.mock.ts';
import type { DashboardData } from '../../types/index.ts';
import { getExpiryAlerts, getLowStockAlerts } from '../../utils/alerts.ts';

export function useDashboard(): DashboardData & { isLoading: boolean } {
  const { data: products, isLoading } = useProducts();

  const lowStock = useMemo(() => getLowStockAlerts(products), [products]);
  const expiryAlerts = useMemo(() => getExpiryAlerts(products), [products]);

  return {
    kpis: dashboardKpis,
    salesByPeriod,
    purchaseVsSales,
    dueProgress,
    lowStock,
    expiryAlerts,
    isLoading,
  };
}
