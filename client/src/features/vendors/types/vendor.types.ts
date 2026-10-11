export type SupplierResponse = {
  id: string;
  companyName: string;
  contactPerson?: string | null;
  phone: string;
  address?: string | null;
  tradeLicense?: string | null;
  paymentTerms?: number | null;
  payableBalance: number;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Alias used across vendor components (vendors = suppliers in the API). */
export type Vendor = SupplierResponse;

export type CreateSupplierPayload = {
  companyName: string;
  contactPerson?: string;
  phone: string;
  address?: string;
  tradeLicense?: string;
  paymentTerms?: number;
  isActive?: boolean;
};

export type UpdateSupplierPayload = {
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  tradeLicense?: string;
  paymentTerms?: number;
  isActive?: boolean;
};

export type VendorFormValues = {
  companyName: string;
  contactPerson?: string;
  phone: string;
  address?: string;
  tradeLicense?: string;
  paymentTerms?: number;
  isActive: boolean;
};

export type VendorListFilters = {
  search: string;
};

export type SupplierListQueryParams = {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
};

export type SupplierListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};
