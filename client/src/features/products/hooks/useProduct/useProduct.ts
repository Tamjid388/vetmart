import {keepPreviousData,  useQuery } from '@tanstack/react-query';
import { getProductById } from '../../api/index.ts';

export function useProduct(id?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id!),
    placeholderData: keepPreviousData,
    enabled: !!id,
  });

  return {
    data: data ?? null,
    isLoading,
    error,
  };
}
