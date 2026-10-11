import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSupplier as apiCreate,
  updateSupplier as apiUpdate,
  deleteSupplier as apiDelete,
} from '../../api/index.ts';
import type { CreateSupplierPayload, UpdateSupplierPayload } from '../../types/index.ts';

export function useVendorMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['vendors'] });
    queryClient.invalidateQueries({ queryKey: ['vendor'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateSupplierPayload) => apiCreate(payload),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSupplierPayload }) =>
      apiUpdate(id, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(id),
    onSuccess: invalidate,
  });

  return {
    createVendor: createMutation.mutate,
    createVendorAsync: createMutation.mutateAsync,
    updateVendor: updateMutation.mutate,
    updateVendorAsync: updateMutation.mutateAsync,
    deleteVendor: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}
