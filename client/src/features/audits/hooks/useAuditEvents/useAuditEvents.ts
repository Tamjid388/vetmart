import { useQuery } from '@tanstack/react-query';
import { getAuditEvents } from '../../api/index.ts';
import type { AuditListQueryParams } from '../../types/index.ts';

export function useAuditEvents(params?: AuditListQueryParams) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['audit-events', params],
    queryFn: () => getAuditEvents(params),
  });

  return {
    data: data?.data ?? [],
    meta: data?.meta,
    total: data?.meta?.total ?? 0,
    isLoading,
    error,
    refetch,
  };
}
