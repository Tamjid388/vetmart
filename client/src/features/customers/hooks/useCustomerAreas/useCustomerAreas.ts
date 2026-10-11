import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getCustomerAreas } from '../../api/index.ts';

/**
 * Distinct area names for the customer form suggestions.
 * Areas change rarely, so the result is cached longer; keepPreviousData
 * keeps old suggestions visible while refetching.
 */
export function useCustomerAreas() {
  const { data, isPending, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['customers', 'areas'],
    queryFn: getCustomerAreas,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  return {
    areas: data ?? [],
    isPending,
    isFetching,
    isError,
    error,
    refetch,
  };
}
