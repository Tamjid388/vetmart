import { useQuery } from '@tanstack/react-query';
import { getSaleById } from '../../api/index.ts';

export function useSale(id?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => getSaleById(id!),
    enabled: !!id,
  });

  return {
    data: data ?? null,
    isLoading,
    error,
  };
}
