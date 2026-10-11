import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSale as apiCreate, voidSale as apiVoid } from '../../api/index.ts';
import type { CreateSalePayload } from '../../types/index.ts';

export function useSaleMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['sales'] });
    queryClient.invalidateQueries({ queryKey: ['sale'] });
    // Stock moved and customer due changed — refresh those lists too.
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['product'] });
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['customer'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateSalePayload) => apiCreate(payload),
    onSuccess: invalidate,
  });

  const voidMutation = useMutation({
    mutationFn: (id: string) => apiVoid(id),
    onSuccess: invalidate,
  });

  return {
    createSale: createMutation.mutate,
    createSaleAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    voidSale: voidMutation.mutate,
    voidSaleAsync: voidMutation.mutateAsync,
    isVoiding: voidMutation.isPending,
    voidError: voidMutation.error,
  };
}
