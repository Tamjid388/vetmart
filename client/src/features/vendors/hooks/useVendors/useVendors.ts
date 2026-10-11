import { useQuery } from '@tanstack/react-query';
import { getSuppliers } from '../../api/index.ts';
import type { SupplierListQueryParams } from '../../types/index.ts';

export function useVendors(params?: SupplierListQueryParams) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['vendors', params],
    queryFn: () => getSuppliers(params),
  });

  return {
    data: data?.data ?? [],
    meta: data?.meta,
    total: data?.meta?.total ?? 0,
    isLoading,
    error,
  };
}
