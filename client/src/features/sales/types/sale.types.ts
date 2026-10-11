export type SalePaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'CARD';

export type SalePaymentStatus = 'PAID' | 'PARTIAL' | 'DUE';

export type SaleType = 'REGISTERED' | 'CASH';

export type SaleItemResponse = {
  id: string;
  saleId: string;
  productId: string;
  batchId: string | null;
  qty: number;
  sellingPrice: number;
  /** Lot cost snapshot — present for admin only. */
  purchasePrice?: number;
  vatPercent: number;
  lineTotal: number;
  product?: {
    id: string;
    name: string;
    unit: string;
  } | null;
  batch?: {
    id: string;
    batchNumber: string | null;
    expiryDate: string | null;
  } | null;
};

export type SaleCustomer = {
  id: string;
  name: string;
  phone: string;
};

export type SaleResponse = {
  id: string;
  invoiceNo: string;
  idempotencyKey: string;
  saleType: SaleType;
  customerId: string | null;
  saleDate: string;
  subtotal: number;
  discount: number;
  vatTotal: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: SalePaymentMethod | null;
  paymentStatus: SalePaymentStatus;
  soldBy: string;
  notes?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: SaleCustomer | null;
  items: SaleItemResponse[];
};

/** Back-compat alias. */
export type Sale = SaleResponse;

export type CreateSaleItemPayload = {
  productId: string;
  qty: number;
};

export type CreateSalePayload = {
  idempotencyKey: string;
  saleType: SaleType;
  /** Required for REGISTERED; omit for CASH. */
  customerId?: string;
  items: CreateSaleItemPayload[];
  discount?: number;
  paymentMethod?: SalePaymentMethod | null;
  paidAmount: number;
  notes?: string;
};

export type SaleListFilters = {
  search: string;
  paymentStatus: 'all' | SalePaymentStatus;
  saleType: 'all' | SaleType;
};

export type SaleListQueryParams = {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  paymentStatus?: SalePaymentStatus;
  saleType?: SaleType;
  customerId?: string;
};

export type SaleListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};

export type ShortStockLine = {
  productId: string;
  productName: string;
  requested: number;
  available: number;
  expiredOnly: boolean;
};
