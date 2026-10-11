export type CustomerCategory = 'Regular' | 'Wholesale';

export type CustomerResponse = {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  area?: string | null;
  category?: string | null;
  dueBalance: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Alias used across customer components. */
export type Customer = CustomerResponse;

export type CreateCustomerPayload = {
  name: string;
  phone: string;
  address?: string;
  area?: string;
  category?: string;
  isActive?: boolean;
};

export type UpdateCustomerPayload = {
  name?: string;
  phone?: string;
  address?: string;
  area?: string;
  category?: string;
  isActive?: boolean;
};

export type CustomerFormValues = {
  name: string;
  phone: string;
  address?: string;
  area?: string;
  category?: CustomerCategory;
  isActive: boolean;
};

export type CustomerListFilters = {
  search: string;
};

export type CustomerListQueryParams = {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  area?: string;
  category?: string;
  isActive?: boolean;
};

export type CustomerListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};
