import { useQuery } from '@tanstack/react-query';
import { getPayments } from '../../api/index.ts';
import type { PaymentListQueryParams } from '../../types/index.ts';

export function usePayments(params?: PaymentListQueryParams) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', params],
    queryFn: () => getPayments(params),
  });

  return {
    data: data?.data ?? [],
    meta: data?.meta,
    total: data?.meta?.total ?? 0,
    isLoading,
    error,
  };
}
