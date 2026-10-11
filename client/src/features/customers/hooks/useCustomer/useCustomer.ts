import { useQuery } from '@tanstack/react-query';
import { getCustomerById } from '../../api/index.ts';

export function useCustomer(id?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomerById(id!),
    enabled: !!id,
  });

  return {
    data: data ?? null,
    isLoading,
    error,
  };
}
