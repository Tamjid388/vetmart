import { useQuery } from '@tanstack/react-query';
import { getAuditOverview } from '../../api/index.ts';

export function useAuditOverview(params?: { dateFrom?: string; dateTo?: string }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-overview', params],
    queryFn: () => getAuditOverview(params),
  });

  return {
    data: data ?? null,
    isLoading,
    error,
    refetch,
  };
}
