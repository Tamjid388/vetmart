import { apiGet, apiGetWithMeta, apiPost } from '../../../lib/axios/axios.ts';
import type {
  CreatePaymentPayload,
  PaymentListMeta,
  PaymentListQueryParams,
  PaymentResponse,
} from '../types/payment.types.ts';

const BASE = '/payments';

export async function getPayments(
  params?: PaymentListQueryParams,
): Promise<{ data: PaymentResponse[]; meta: PaymentListMeta | undefined }> {
  const query: Record<string, string> = {};
  if (params?.searchTerm) query.searchTerm = params.searchTerm;
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  if (params?.sortBy) query.sortBy = params.sortBy;
  if (params?.sortOrder) query.sortOrder = params.sortOrder;
  if (params?.customerId) query.customerId = params.customerId;
  if (params?.saleId) query.saleId = params.saleId;
  if (params?.supplierId) query.supplierId = params.supplierId;
  if (params?.purchaseId) query.purchaseId = params.purchaseId;
  if (params?.method) query.method = params.method;

  const res = await apiGetWithMeta<PaymentResponse[]>(BASE, { params: query });
  return res;
}

export async function getPaymentById(id: string): Promise<PaymentResponse> {
  return apiGet<PaymentResponse>(`${BASE}/${id}`);
}

export async function createPayment(payload: CreatePaymentPayload): Promise<PaymentResponse> {
  return apiPost<PaymentResponse>(BASE, payload);
}
