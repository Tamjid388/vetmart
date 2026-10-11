import { apiGet, apiGetWithMeta } from '../../../lib/axios/axios.ts';
import type {
  AuditEvent,
  AuditEventDetail,
  AuditListMeta,
  AuditListQueryParams,
  AuditOverview,
} from '../types/audit.types.ts';

const BASE = '/audits';

export async function getAuditOverview(params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<AuditOverview> {
  const query: Record<string, string> = {};
  if (params?.dateFrom) query.dateFrom = params.dateFrom;
  if (params?.dateTo) query.dateTo = params.dateTo;
  return apiGet<AuditOverview>(`${BASE}/overview`, { params: query });
}

export async function getAuditEvents(
  params?: AuditListQueryParams,
): Promise<{ data: AuditEvent[]; meta: AuditListMeta | undefined }> {
  const query: Record<string, string> = {};
  if (params?.searchTerm) query.searchTerm = params.searchTerm;
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  if (params?.sortOrder) query.sortOrder = params.sortOrder;
  if (params?.module) query.module = params.module;
  if (params?.action) query.action = params.action;
  if (params?.userId) query.userId = params.userId;
  if (params?.dateFrom) query.dateFrom = params.dateFrom;
  if (params?.dateTo) query.dateTo = params.dateTo;

  const res = await apiGetWithMeta<AuditEvent[]>(`${BASE}/events`, { params: query });
  return res;
}

export async function getAuditEventDetail(module: string, id: string): Promise<AuditEventDetail> {
  return apiGet<AuditEventDetail>(`${BASE}/events/${module}/${id}`);
}
