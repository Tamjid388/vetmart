import { apiGet, apiGetWithMeta, apiPost, apiPatch, apiDelete } from '../../../lib/axios/axios.ts';
import type {
  CreateSupplierPayload,
  SupplierListMeta,
  SupplierListQueryParams,
  SupplierResponse,
  UpdateSupplierPayload,
} from '../types/vendor.types.ts';

const BASE = '/suppliers';

export async function getSuppliers(
  params?: SupplierListQueryParams,
): Promise<{ data: SupplierResponse[]; meta: SupplierListMeta | undefined }> {
  const query: Record<string, string> = {};
  if (params?.searchTerm) query.searchTerm = params.searchTerm;
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  if (params?.sortBy) query.sortBy = params.sortBy;
  if (params?.sortOrder) query.sortOrder = params.sortOrder;
  if (params?.isActive !== undefined) query.isActive = String(params.isActive);

  const res = await apiGetWithMeta<SupplierResponse[]>(BASE, { params: query });
  return res;
}

export async function getSupplierById(id: string): Promise<SupplierResponse> {
  return apiGet<SupplierResponse>(`${BASE}/${id}`);
}

export async function createSupplier(payload: CreateSupplierPayload): Promise<SupplierResponse> {
  return apiPost<SupplierResponse>(BASE, payload);
}

export async function updateSupplier(
  id: string,
  payload: UpdateSupplierPayload,
): Promise<SupplierResponse> {
  return apiPatch<SupplierResponse>(`${BASE}/${id}`, payload);
}

export async function deleteSupplier(id: string): Promise<SupplierResponse> {
  return apiDelete<SupplierResponse>(`${BASE}/${id}`);
}
