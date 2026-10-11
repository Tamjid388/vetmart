import { useQuery } from '@tanstack/react-query';
import { getCustomers } from '../../api/index.ts';
import type { CustomerListQueryParams } from '../../types/index.ts';

export function useCustomers(params?: CustomerListQueryParams) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', params],
    queryFn: () => getCustomers(params),
  });

  return {
    data: data?.data ?? [],
    meta: data?.meta,
    total: data?.meta?.total ?? 0,
    isLoading,
    error,
  };
}
