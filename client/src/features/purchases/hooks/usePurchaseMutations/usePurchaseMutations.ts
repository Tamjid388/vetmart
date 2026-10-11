import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPurchase as apiCreate, voidPurchase as apiVoid } from '../../api/index.ts';
import type { CreatePurchasePayload } from '../../types/index.ts';

export function usePurchaseMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['purchases'] });
    queryClient.invalidateQueries({ queryKey: ['purchase'] });
    // Lots moved, master costs and supplier payable changed — refresh those too.
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['product'] });
    queryClient.invalidateQueries({ queryKey: ['vendors'] });
    queryClient.invalidateQueries({ queryKey: ['vendor'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreatePurchasePayload) => apiCreate(payload),
    onSuccess: invalidate,
  });

  const voidMutation = useMutation({
    mutationFn: (id: string) => apiVoid(id),
    onSuccess: invalidate,
  });

  return {
    createPurchase: createMutation.mutate,
    createPurchaseAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    voidPurchase: voidMutation.mutate,
    voidPurchaseAsync: voidMutation.mutateAsync,
    isVoiding: voidMutation.isPending,
    voidError: voidMutation.error,
  };
}
