import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getCustomerDropdown, type CustomerDropdownQueryParams } from '../../api/index.ts';

/**
 * Shared searchable customer dropdown source.
 * Lightweight GET /customers/dropdown (id/name/phone/area), cached 60s.
 */
export function useCustomerDropdown(params?: CustomerDropdownQueryParams) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['customers', 'dropdown', params],
    queryFn: () => getCustomerDropdown(params),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  return {
    data: data ?? [],
    isLoading,
    error,
  };
}
