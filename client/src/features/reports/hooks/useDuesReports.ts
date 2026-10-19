import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getCustomerDuesReport, getVendorDuesReport } from '../api/index.ts';
import type { ReportQueryParams } from '../types/index.ts';

export function useCustomerDues(params?: ReportQueryParams) {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'customer-dues', params],
    queryFn: () => getCustomerDuesReport(params),
    placeholderData: keepPreviousData,
  });

  return {
    data: data?.data.rows ?? [],
    summary: data?.data.summary ?? { totalDue: 0 },
    meta: data?.meta,
    total: data?.meta?.total ?? 0,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}

export function useVendorDues(params?: ReportQueryParams) {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'vendor-dues', params],
    queryFn: () => getVendorDuesReport(params),
    placeholderData: keepPreviousData,
  });

  return {
    data: data?.data.rows ?? [],
    summary: data?.data.summary ?? { totalDue: 0 },
    meta: data?.meta,
    total: data?.meta?.total ?? 0,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}
