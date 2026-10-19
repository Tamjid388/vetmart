import { apiGet, apiGetWithMeta } from '../../../lib/axios/axios.ts';
import type {
  CustomerDueRow,
  ExpiryReportRow,
  ProfitByProductRow,
  ProfitSummary,
  PurchaseReportRow,
  ReportListMeta,
  ReportOverview,
  ReportQueryParams,
  SalesReportRow,
  StockReportRow,
  VendorDueRow,
} from '../types/index.ts';

const BASE = '/reports';

function toQuery(params?: ReportQueryParams): Record<string, string> {
  const query: Record<string, string> = {};
  if (!params) return query;
  if (params.dateFrom) query.dateFrom = params.dateFrom;
  if (params.dateTo) query.dateTo = params.dateTo;
  if (params.searchTerm) query.searchTerm = params.searchTerm;
  if (params.paymentStatus) query.paymentStatus = params.paymentStatus;
  if (params.area) query.area = params.area;
  if (params.productType) query.productType = params.productType;
  if (params.stockStatus) query.stockStatus = params.stockStatus;
  if (params.expiryStatus) query.expiryStatus = params.expiryStatus;
  if (params.days !== undefined) query.days = String(params.days);
  if (params.page !== undefined) query.page = String(params.page);
  if (params.limit !== undefined) query.limit = String(params.limit);
  if (params.sortOrder) query.sortOrder = params.sortOrder;
  return query;
}

export async function getReportOverview(params?: ReportQueryParams): Promise<ReportOverview> {
  return apiGet<ReportOverview>(`${BASE}/overview`, { params: toQuery(params) });
}

export async function getSalesReport(
  params?: ReportQueryParams,
): Promise<{ data: SalesReportRow[]; meta: ReportListMeta | undefined }> {
  return apiGetWithMeta<SalesReportRow[]>(`${BASE}/sales`, { params: toQuery(params) });
}

export async function getPurchasesReport(
  params?: ReportQueryParams,
): Promise<{ data: PurchaseReportRow[]; meta: ReportListMeta | undefined }> {
  return apiGetWithMeta<PurchaseReportRow[]>(`${BASE}/purchases`, { params: toQuery(params) });
}

export async function getProfitSummary(params?: ReportQueryParams): Promise<ProfitSummary> {
  return apiGet<ProfitSummary>(`${BASE}/profit/summary`, { params: toQuery(params) });
}

export async function getProfitByProduct(
  params?: ReportQueryParams,
): Promise<{ data: ProfitByProductRow[]; meta: ReportListMeta | undefined }> {
  return apiGetWithMeta<ProfitByProductRow[]>(`${BASE}/profit/by-product`, { params: toQuery(params) });
}

export type DueListResponse<T> = {
  summary: { totalDue: number };
  rows: T[];
};

export async function getCustomerDuesReport(
  params?: ReportQueryParams,
): Promise<{ data: DueListResponse<CustomerDueRow>; meta: ReportListMeta | undefined }> {
  return apiGetWithMeta<DueListResponse<CustomerDueRow>>(`${BASE}/customer-dues`, {
    params: toQuery(params),
  });
}

export async function getVendorDuesReport(
  params?: ReportQueryParams,
): Promise<{ data: DueListResponse<VendorDueRow>; meta: ReportListMeta | undefined }> {
  return apiGetWithMeta<DueListResponse<VendorDueRow>>(`${BASE}/vendor-dues`, {
    params: toQuery(params),
  });
}

export type StockListResponse = {
  summary: {
    totalProducts: number;
    stockValue: number;
    lowCount: number;
    criticalCount: number;
    outOfStockCount: number;
  };
  rows: StockReportRow[];
};

export async function getStockReport(
  params?: ReportQueryParams,
): Promise<{ data: StockListResponse; meta: ReportListMeta | undefined }> {
  return apiGetWithMeta<StockListResponse>(`${BASE}/stock`, { params: toQuery(params) });
}

export type ExpiryListResponse = {
  summary: { expiredBatches: number; nearExpiryBatches: number };
  rows: ExpiryReportRow[];
};

export async function getExpiryReport(
  params?: ReportQueryParams,
): Promise<{ data: ExpiryListResponse; meta: ReportListMeta | undefined }> {
  return apiGetWithMeta<ExpiryListResponse>(`${BASE}/expiry`, { params: toQuery(params) });
}
