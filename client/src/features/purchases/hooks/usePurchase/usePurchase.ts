import { useQuery } from '@tanstack/react-query';
import { getPurchaseById } from '../../api/index.ts';

export function usePurchase(id?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase', id],
    queryFn: () => getPurchaseById(id!),
    enabled: !!id,
  });

  return {
    data: data ?? null,
    isLoading,
    error,
  };
}
