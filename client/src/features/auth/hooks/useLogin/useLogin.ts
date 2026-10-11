import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login } from '../../api/index.ts';
import { meQueryKey } from '../useMe/index.ts';

/** Login mutation — stores nothing locally; session lives in HttpOnly cookies. */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      queryClient.setQueryData(meQueryKey, data.user);
    },
  });
}
