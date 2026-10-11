import { apiGet, apiGetWithMeta, apiPost } from '../../../lib/axios/axios.ts';
import type {
  CreatePurchasePayload,
  PurchaseListMeta,
  PurchaseListQueryParams,
  PurchaseResponse,
} from '../types/purchase.types.ts';

const BASE = '/purchases';

export async function getPurchases(
  params?: PurchaseListQueryParams,
): Promise<{ data: PurchaseResponse[]; meta: PurchaseListMeta | undefined }> {
  const query: Record<string, string> = {};
  if (params?.searchTerm) query.searchTerm = params.searchTerm;
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  if (params?.sortBy) query.sortBy = params.sortBy;
  if (params?.sortOrder) query.sortOrder = params.sortOrder;
  if (params?.paymentStatus) query.paymentStatus = params.paymentStatus;
  if (params?.supplierId) query.supplierId = params.supplierId;

  const res = await apiGetWithMeta<PurchaseResponse[]>(BASE, { params: query });
  return res;
}

export async function getPurchaseById(id: string): Promise<PurchaseResponse> {
  return apiGet<PurchaseResponse>(`${BASE}/${id}`);
}

export async function createPurchase(payload: CreatePurchasePayload): Promise<PurchaseResponse> {
  return apiPost<PurchaseResponse>(BASE, payload);
}

export async function voidPurchase(id: string): Promise<PurchaseResponse> {
  return apiPost<PurchaseResponse>(`${BASE}/${id}/void`);
}
