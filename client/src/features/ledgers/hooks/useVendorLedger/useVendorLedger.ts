import { useQuery } from '@tanstack/react-query';
import { getVendorLedger } from '../../api/index.ts';
import type { PurchaseListQueryParams } from '../../../purchases/types/index.ts';

export function useVendorLedger(params?: PurchaseListQueryParams) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ledgers', 'vendor', params],
    queryFn: () => getVendorLedger(params),
  });

  return {
    data: data?.data ?? [],
    meta: data?.meta,
    total: data?.meta?.total ?? 0,
    isLoading,
    error,
  };
}
