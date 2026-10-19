import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getProfitByProduct, getProfitSummary } from '../api/index.ts';
import type { ReportQueryParams } from '../types/index.ts';

export function useProfitSummary(params?: ReportQueryParams) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'profit-summary', params],
    queryFn: () => getProfitSummary(params),
    placeholderData: keepPreviousData,
  });

  return { data: data ?? null, isLoading, isError, error, refetch };
}

export function useProfitByProduct(params?: ReportQueryParams) {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'profit-by-product', params],
    queryFn: () => getProfitByProduct(params),
    placeholderData: keepPreviousData,
  });

  return {
    data: data?.data ?? [],
    meta: data?.meta,
    total: data?.meta?.total ?? 0,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}
