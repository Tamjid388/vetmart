import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getSalesReport } from '../api/index.ts';
import type { ReportQueryParams } from '../types/index.ts';

export function useSalesReport(params?: ReportQueryParams) {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'sales', params],
    queryFn: () => getSalesReport(params),
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
