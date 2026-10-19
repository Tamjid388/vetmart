import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../../api/index.ts';
import type { DashboardData } from '../../types/index.ts';

const EMPTY: DashboardData = {
  kpis: [],
  salesByPeriod: { today: [], week: [], month: [] },
  purchaseVsSales: [],
  dueProgress: [],
  lowStock: [],
  expiryAlerts: [],
};

export function useDashboard() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });

  return {
    kpis: data?.kpis ?? EMPTY.kpis,
    salesByPeriod: data?.salesByPeriod ?? EMPTY.salesByPeriod,
    purchaseVsSales: data?.purchaseVsSales ?? EMPTY.purchaseVsSales,
    dueProgress: data?.dueProgress ?? EMPTY.dueProgress,
    lowStock: data?.lowStock ?? EMPTY.lowStock,
    expiryAlerts: data?.expiryAlerts ?? EMPTY.expiryAlerts,
    isLoading,
    isError,
    error,
    refetch,
  };
}
