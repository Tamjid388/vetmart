import { apiGet, apiGetWithMeta, apiPost, apiPatch, apiDelete } from '../../../lib/axios/axios.ts';
import type {
  CreateProductPayload,
  ProductListMeta,
  ProductListQueryParams,
  ProductResponse,
  UpdateProductPayload,
} from '../types/product-api.types.ts';

const BASE = '/products';

export async function getProducts(
  params?: ProductListQueryParams,
): Promise<{ data: ProductResponse[]; meta: ProductListMeta | undefined }> {
  const query: Record<string, string> = {};
  if (params?.searchTerm) query.searchTerm = params.searchTerm;
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  if (params?.sortBy) query.sortBy = params.sortBy;
  if (params?.sortOrder) query.sortOrder = params.sortOrder;
  if (params?.productType) query.productType = params.productType;
  if (params?.categoryId) query.categoryId = params.categoryId;
  if (params?.unit) query.unit = params.unit;
  if (params?.isActive !== undefined) query.isActive = String(params.isActive);
  if (params?.manufacturer) query.manufacturer = params.manufacturer;

  const res = await apiGetWithMeta<ProductResponse[]>(BASE, { params: query });
  return res;
}

export async function getProductById(id: string): Promise<ProductResponse> {
  return apiGet<ProductResponse>(`${BASE}/${id}`);
}

export async function createProduct(payload: CreateProductPayload): Promise<ProductResponse> {
  return apiPost<ProductResponse>(BASE, payload);
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload,
): Promise<ProductResponse> {
  return apiPatch<ProductResponse>(`${BASE}/${id}`, payload);
}

export async function deleteProduct(id: string): Promise<ProductResponse> {
  return apiDelete<ProductResponse>(`${BASE}/${id}`);
}
