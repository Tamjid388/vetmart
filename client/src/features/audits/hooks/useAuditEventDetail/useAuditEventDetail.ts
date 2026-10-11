import { useQuery } from '@tanstack/react-query';
import { getAuditEventDetail } from '../../api/index.ts';

export function useAuditEventDetail(module?: string, id?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-event', module, id],
    queryFn: () => getAuditEventDetail(module!, id!),
    enabled: !!module && !!id,
  });

  return {
    data: data ?? null,
    isLoading,
    error,
  };
}
