import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getReportOverview } from '../api/index.ts';
import type { ReportQueryParams } from '../types/index.ts';

export function useReportOverview(params?: ReportQueryParams) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reports', 'overview', params],
    queryFn: () => getReportOverview(params),
    placeholderData: keepPreviousData,
  });

  return { data: data ?? null, isLoading, isError, error, refetch };
}
