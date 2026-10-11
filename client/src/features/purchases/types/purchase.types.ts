export type PurchasePaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'CARD';

export type PurchasePaymentStatus = 'PAID' | 'PARTIAL' | 'DUE';

export type PurchaseItemResponse = {
  id: string;
  purchaseId: string;
  productId: string;
  batchId: string | null;
  qty: number;
  purchasePrice: number;
  sellingPrice: number;
  vatPercent: number;
  lineTotal: number;
  batchNumber?: string | null;
  expiryDate?: string | null;
  weightKg?: number | null;
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

export type PurchaseSupplier = {
  id: string;
  companyName: string;
  phone: string;
};

export type PurchaseResponse = {
  id: string;
  invoiceNo: string;
  idempotencyKey: string;
  supplierId: string;
  purchaseDate: string;
  subtotal: number;
  discount: number;
  vatTotal: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod: PurchasePaymentMethod | null;
  paymentStatus: PurchasePaymentStatus;
  receivedBy: string;
  notes?: string | null;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  supplier?: PurchaseSupplier | null;
  items: PurchaseItemResponse[];
};

/** Back-compat alias. */
export type Purchase = PurchaseResponse;

export type CreatePurchaseItemPayload = {
  productId: string;
  qty: number;
  purchasePrice: number;
  batchNumber?: string;
  expiryDate: string;
  weightKg?: number;
};

export type CreatePurchasePayload = {
  idempotencyKey: string;
  supplierId: string;
  items: CreatePurchaseItemPayload[];
  discount?: number;
  paymentMethod?: PurchasePaymentMethod | null;
  paidAmount: number;
  notes?: string;
};

export type PurchaseListFilters = {
  search: string;
  paymentStatus: 'all' | PurchasePaymentStatus;
};

export type PurchaseListQueryParams = {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  paymentStatus?: PurchasePaymentStatus;
  supplierId?: string;
};

export type PurchaseListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};
