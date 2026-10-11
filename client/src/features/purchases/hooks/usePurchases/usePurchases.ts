import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getPurchases } from '../../api/index.ts';
import type { PurchaseListQueryParams } from '../../types/index.ts';

export function usePurchases(params?: PurchaseListQueryParams) {
  const { data, isPending, isFetching, isPlaceholderData, error } = useQuery({
    queryKey: ['purchases', params],
    queryFn: () => getPurchases(params),
    placeholderData: keepPreviousData,
  });

  return {
    data: data?.data ?? [],
    meta: data?.meta,
    total: data?.meta?.total ?? 0,
    isPending,
    isFetching,
    isPlaceholderData,
    error,
  };
}
