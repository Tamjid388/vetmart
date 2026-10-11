import { useQuery } from '@tanstack/react-query';
import { getPaymentById } from '../../api/index.ts';

export function usePayment(id?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => getPaymentById(id!),
    enabled: !!id,
  });

  return {
    data: data ?? null,
    isLoading,
    error,
  };
}
