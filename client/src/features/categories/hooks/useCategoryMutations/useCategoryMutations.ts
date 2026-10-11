import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCategory as apiCreate,
  deleteCategory as apiDelete,
  updateCategory as apiUpdate,
} from '../../api/index.ts';
import type { CreateCategoryPayload, UpdateCategoryPayload } from '../../api/index.ts';

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateCategoryPayload) => apiCreate(payload),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
      apiUpdate(id, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(id),
    onSuccess: invalidate,
  });

  return {
    createCategory: createMutation.mutate,
    createCategoryAsync: createMutation.mutateAsync,
    updateCategory: updateMutation.mutate,
    updateCategoryAsync: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutate,
    deleteCategoryAsync: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}
