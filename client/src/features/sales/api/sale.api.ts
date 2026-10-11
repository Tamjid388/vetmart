import { apiGet, apiGetWithMeta, apiPost } from '../../../lib/axios/axios.ts';
import type {
  CreateSalePayload,
  SaleListMeta,
  SaleListQueryParams,
  SaleResponse,
} from '../types/sale.types.ts';

const BASE = '/sales';

export async function getSales(
  params?: SaleListQueryParams,
): Promise<{ data: SaleResponse[]; meta: SaleListMeta | undefined }> {
  const query: Record<string, string> = {};
  if (params?.searchTerm) query.searchTerm = params.searchTerm;
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  if (params?.sortBy) query.sortBy = params.sortBy;
  if (params?.sortOrder) query.sortOrder = params.sortOrder;
  if (params?.paymentStatus) query.paymentStatus = params.paymentStatus;
  if (params?.saleType) query.saleType = params.saleType;
  if (params?.customerId) query.customerId = params.customerId;

  const res = await apiGetWithMeta<SaleResponse[]>(BASE, { params: query });
  return res;
}

export async function getSaleById(id: string): Promise<SaleResponse> {
  return apiGet<SaleResponse>(`${BASE}/${id}`);
}

export async function createSale(payload: CreateSalePayload): Promise<SaleResponse> {
  return apiPost<SaleResponse>(BASE, payload);
}

export async function voidSale(id: string): Promise<SaleResponse> {
  return apiPost<SaleResponse>(`${BASE}/${id}/void`);
}
