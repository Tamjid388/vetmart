import { apiDelete, apiGet, apiGetWithMeta, apiPatch, apiPost } from '../../../lib/axios/axios.ts';
import type { ProductType } from '../../products/types/index.ts';

export type CategoryResponse = {
  id: string;
  productType: ProductType;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
};

export type CategoryListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};

export type CategoryListParams = {
  productType?: ProductType;
  isActive?: boolean;
  searchTerm?: string;
  page?: number;
  limit?: number;
};

export type CreateCategoryPayload = {
  productType: ProductType;
  name: string;
  isActive?: boolean;
};

export type UpdateCategoryPayload = {
  productType?: ProductType;
  name?: string;
  isActive?: boolean;
};

const BASE = '/categories';

export async function getCategories(
  params?: CategoryListParams,
): Promise<{ data: CategoryResponse[]; meta: CategoryListMeta | undefined }> {
  const query: Record<string, string> = {};
  if (params?.productType) query.productType = params.productType;
  if (params?.isActive !== undefined) query.isActive = String(params.isActive);
  if (params?.searchTerm) query.searchTerm = params.searchTerm;
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  // Large enough for dropdowns; server caps at 100.
  if (!params?.page && !params?.limit) query.limit = '100';
  const res = await apiGetWithMeta<CategoryResponse[]>(BASE, { params: query });
  return res;
}

export async function getCategoryById(id: string): Promise<CategoryResponse> {
  return apiGet<CategoryResponse>(`${BASE}/${id}`);
}

export async function createCategory(payload: CreateCategoryPayload): Promise<CategoryResponse> {
  return apiPost<CategoryResponse>(BASE, payload);
}

export async function updateCategory(
  id: string,
  payload: UpdateCategoryPayload,
): Promise<CategoryResponse> {
  return apiPatch<CategoryResponse>(`${BASE}/${id}`, payload);
}

export async function deleteCategory(id: string): Promise<CategoryResponse> {
  return apiDelete<CategoryResponse>(`${BASE}/${id}`);
}
