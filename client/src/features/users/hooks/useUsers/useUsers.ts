import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../../api/index.ts';
import type { UserListQueryParams } from '../../types/index.ts';

export function useUsers(params?: UserListQueryParams) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', params],
    queryFn: () => getUsers(params),
  });

  return {
    data: data?.data ?? [],
    meta: data?.meta,
    total: data?.meta?.total ?? 0,
    isLoading,
    error,
  };
}
