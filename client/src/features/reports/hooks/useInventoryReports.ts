import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getExpiryReport, getStockReport } from '../api/index.ts';
import type { ReportQueryParams } from '../types/index.ts';

export function useStockReport(params?: ReportQueryParams) {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'stock', params],
    queryFn: () => getStockReport(params),
    placeholderData: keepPreviousData,
  });

  return {
    data: data?.data.rows ?? [],
    summary: data?.data.summary ?? {
      totalProducts: 0,
      stockValue: 0,
      lowCount: 0,
      criticalCount: 0,
      outOfStockCount: 0,
    },
    meta: data?.meta,
    total: data?.meta?.total ?? 0,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}

export function useExpiryReport(params?: ReportQueryParams) {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'expiry', params],
    queryFn: () => getExpiryReport(params),
    placeholderData: keepPreviousData,
  });

  return {
    data: data?.data.rows ?? [],
    summary: data?.data.summary ?? { expiredBatches: 0, nearExpiryBatches: 0 },
    meta: data?.meta,
    total: data?.meta?.total ?? 0,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}
