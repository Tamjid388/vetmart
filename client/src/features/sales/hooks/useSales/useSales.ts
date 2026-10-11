import { useQuery } from '@tanstack/react-query';
import { getSales } from '../../api/index.ts';
import type { SaleListQueryParams } from '../../types/index.ts';

export function useSales(params?: SaleListQueryParams) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sales', params],
    queryFn: () => getSales(params),
  });

  return {
    data: data?.data ?? [],
    meta: data?.meta,
    total: data?.meta?.total ?? 0,
    isLoading,
    error,
  };
}
