import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getCategories } from '../../api/index.ts';
import type { CategoryListParams } from '../../api/index.ts';
import type { ProductType } from '../../../products/types/index.ts';

export function useCategories(productType?: ProductType, activeOnly = true) {
  const params: CategoryListParams = {
    ...(productType ? { productType } : {}),
    ...(activeOnly ? { isActive: true } : {}),
    limit: 100,
  };

  const { data, isPending, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['categories', productType ?? 'ALL', activeOnly ? 'active' : 'all'],
    queryFn: () => getCategories(params),
    placeholderData: keepPreviousData,
  });

  return {
    categories: data?.data ?? [],
    meta: data?.meta,
    total: data?.meta?.total ?? 0,
    isPending,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}
