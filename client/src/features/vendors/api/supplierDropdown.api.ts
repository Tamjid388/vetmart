import { apiGet } from '../../../lib/axios/axios.ts';

export type SupplierDropdownItem = {
  id: string;
  companyName: string;
  phone: string;
};

export type SupplierDropdownQueryParams = {
  searchTerm?: string;
  limit?: number;
};

const BASE = '/suppliers/dropdown';

export async function getSupplierDropdown(
  params?: SupplierDropdownQueryParams,
): Promise<SupplierDropdownItem[]> {
  const query: Record<string, string> = {};
  if (params?.searchTerm?.trim()) query.searchTerm = params.searchTerm.trim();
  if (params?.limit) query.limit = String(params.limit);
  return apiGet<SupplierDropdownItem[]>(BASE, { params: query });
}
