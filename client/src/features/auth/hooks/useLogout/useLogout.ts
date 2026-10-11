import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { logout } from '../../api/index.ts';
import { meQueryKey } from '../useMe/index.ts';

/** Logout mutation — clears server cookies, then drops the cached session. */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.setQueryData(meQueryKey, null);
      void queryClient.invalidateQueries({ queryKey: meQueryKey });
      navigate('/auth/login', { replace: true });
    },
  });
}
