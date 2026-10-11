import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCustomer as apiCreate,
  updateCustomer as apiUpdate,
  deleteCustomer as apiDelete,
} from '../../api/index.ts';
import type { CreateCustomerPayload, UpdateCustomerPayload } from '../../types/index.ts';

export function useCustomerMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['customers'] });
    queryClient.invalidateQueries({ queryKey: ['customer'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateCustomerPayload) => apiCreate(payload),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCustomerPayload }) =>
      apiUpdate(id, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(id),
    onSuccess: invalidate,
  });

  return {
    createCustomer: createMutation.mutate,
    createCustomerAsync: createMutation.mutateAsync,
    updateCustomer: updateMutation.mutate,
    updateCustomerAsync: updateMutation.mutateAsync,
    deleteCustomer: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}
