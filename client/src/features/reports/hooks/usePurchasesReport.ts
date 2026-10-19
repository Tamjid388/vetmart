import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getPurchasesReport } from '../api/index.ts';
import type { ReportQueryParams } from '../types/index.ts';

export function usePurchasesReport(params?: ReportQueryParams) {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'purchases', params],
    queryFn: () => getPurchasesReport(params),
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
