import { useQuery } from '@tanstack/react-query';
import { getSupplierById } from '../../api/index.ts';

export function useVendor(id?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => getSupplierById(id!),
    enabled: !!id,
  });

  return {
    data: data ?? null,
    isLoading,
    error,
  };
}
