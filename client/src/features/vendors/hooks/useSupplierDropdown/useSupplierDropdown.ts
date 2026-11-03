import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getSupplierDropdown, type SupplierDropdownQueryParams } from '../../api/index.ts';

/**
 * Lightweight searchable supplier dropdown source.
 * GET /suppliers/dropdown (id/companyName/phone), cached 60s.
 * Used by the purchase module vendor selector + vendor ledger filters.
 */
export function useSupplierDropdown(params?: SupplierDropdownQueryParams) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['suppliers', 'dropdown', params],
    queryFn: () => getSupplierDropdown(params),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  return {
    data: data ?? [],
    isLoading,
    error,
  };
}
