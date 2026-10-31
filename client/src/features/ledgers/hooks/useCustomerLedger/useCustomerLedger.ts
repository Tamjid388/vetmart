import { useQuery } from '@tanstack/react-query';
import { getCustomerLedger } from '../../api/index.ts';
import type { SaleListQueryParams } from '../../../sales/types/index.ts';

export function useCustomerLedger(params?: SaleListQueryParams) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ledgers', 'customer', params],
    queryFn: () => getCustomerLedger(params),
  });

  return {
    data: data?.data ?? [],
    meta: data?.meta,
    total: data?.meta?.total ?? 0,
    isLoading,
    error,
  };
}
