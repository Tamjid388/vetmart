import { apiGet } from '../../lib/axios/axios.ts';

export type CustomerDropdownItem = {
  id: string;
  name: string;
  phone: string;
  area: string | null;
};

export type CustomerDropdownQueryParams = {
  searchTerm?: string;
  limit?: number;
};

const BASE = '/customers/dropdown';

export async function getCustomerDropdown(
  params?: CustomerDropdownQueryParams,
): Promise<CustomerDropdownItem[]> {
  const query: Record<string, string> = {};
  if (params?.searchTerm?.trim()) query.searchTerm = params.searchTerm.trim();
  if (params?.limit) query.limit = String(params.limit);
  return apiGet<CustomerDropdownItem[]>(BASE, { params: query });
}
