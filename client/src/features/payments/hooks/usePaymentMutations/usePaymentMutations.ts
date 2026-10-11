import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPayment as apiCreate } from '../../api/index.ts';
import type { CreatePaymentPayload } from '../../types/index.ts';

export function usePaymentMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['payments'] });
    queryClient.invalidateQueries({ queryKey: ['payment'] });
    // Due balances changed — refresh customer lists/details too.
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['customer'] });
    // Vendor payables changed — refresh supplier + purchase lists too.
    queryClient.invalidateQueries({ queryKey: ['vendors'] });
    queryClient.invalidateQueries({ queryKey: ['vendor'] });
    queryClient.invalidateQueries({ queryKey: ['purchases'] });
    queryClient.invalidateQueries({ queryKey: ['purchase'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreatePaymentPayload) => apiCreate(payload),
    onSuccess: invalidate,
  });

  return {
    createPayment: createMutation.mutate,
    createPaymentAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
  };
}
