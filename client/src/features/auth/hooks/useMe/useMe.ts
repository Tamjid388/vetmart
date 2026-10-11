import { useQuery } from '@tanstack/react-query';
import { fetchMe } from '../../api/index.ts';

export const meQueryKey = ['me'] as const;

/** Current session user. No token checks — auth state comes from this query. */
export function useMe() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: meQueryKey,
    queryFn: fetchMe,
    retry: false,
  });

  return {
    user: data ?? null,
    isLoading,
    isError,
    error,
    isAdmin: data?.role === 'admin',
  };
}
