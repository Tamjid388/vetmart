import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getProducts } from '../../api/index.ts';
import type { ProductListQueryParams } from '../../types/index.ts';

export function useProducts(params?: ProductListQueryParams) {
  const {
    data,
    isPending,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
    placeholderData: keepPreviousData,
  });

  return {
    data: data?.data ?? [],
    meta: data?.meta,
    total: data?.meta?.total ?? 0,
    isPending,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
    error,
    refetch,
  };
}
