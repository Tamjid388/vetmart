import { apiGet, apiGetWithMeta, apiPost, apiPatch, apiDelete } from '../../../lib/axios/axios.ts';
import type {
  CreateCustomerPayload,
  CustomerListMeta,
  CustomerListQueryParams,
  CustomerResponse,
  UpdateCustomerPayload,
} from '../types/customer.types.ts';

const BASE = '/customers';

export async function getCustomers(
  params?: CustomerListQueryParams,
): Promise<{ data: CustomerResponse[]; meta: CustomerListMeta | undefined }> {
  const query: Record<string, string> = {};
  if (params?.searchTerm) query.searchTerm = params.searchTerm;
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  if (params?.sortBy) query.sortBy = params.sortBy;
  if (params?.sortOrder) query.sortOrder = params.sortOrder;
  if (params?.area) query.area = params.area;
  if (params?.category) query.category = params.category;
  if (params?.isActive !== undefined) query.isActive = String(params.isActive);

  const res = await apiGetWithMeta<CustomerResponse[]>(BASE, { params: query });
  return res;
}

export async function getCustomerById(id: string): Promise<CustomerResponse> {
  return apiGet<CustomerResponse>(`${BASE}/${id}`);
}

/** Distinct area names already in the DB (lowercase canonical form). */
export async function getCustomerAreas(): Promise<string[]> {
  return apiGet<string[]>(`${BASE}/areas`);
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<CustomerResponse> {
  return apiPost<CustomerResponse>(BASE, payload);
}

export async function updateCustomer(
  id: string,
  payload: UpdateCustomerPayload,
): Promise<CustomerResponse> {
  return apiPatch<CustomerResponse>(`${BASE}/${id}`, payload);
}

export async function deleteCustomer(id: string): Promise<CustomerResponse> {
  return apiDelete<CustomerResponse>(`${BASE}/${id}`);
}
