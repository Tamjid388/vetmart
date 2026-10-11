export type PaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'CARD';

export type PaymentCustomer = {
  id: string;
  name: string;
  phone: string;
};

export type PaymentSale = {
  id: string;
  invoiceNo: string;
  grandTotal: number;
  dueAmount: number;
} | null;

export type PaymentSupplier = {
  id: string;
  companyName: string;
  phone: string;
};

export type PaymentPurchase = {
  id: string;
  invoiceNo: string;
  grandTotal: number;
  dueAmount: number;
} | null;

export type PaymentCollector = {
  id: string;
  name: string | null;
  email: string;
};

export type PaymentResponse = {
  id: string;
  saleId: string | null;
  customerId: string | null;
  supplierId: string | null;
  purchaseId: string | null;
  amount: number;
  method: PaymentMethod;
  collectedBy: string;
  paidAt: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: PaymentCustomer | null;
  sale?: PaymentSale;
  supplier?: PaymentSupplier | null;
  purchase?: PaymentPurchase;
  collectedByUser?: PaymentCollector | null;
};

/** Back-compat alias. */
export type Payment = PaymentResponse;

export type CreatePaymentPayload = {
  customerId?: string;
  saleId?: string | null;
  supplierId?: string;
  purchaseId?: string | null;
  amount: number;
  method: PaymentMethod;
  paidAt?: string;
};

export type PaymentListFilters = {
  search: string;
  method: 'all' | PaymentMethod;
};

export type PaymentListQueryParams = {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  customerId?: string;
  saleId?: string;
  supplierId?: string;
  purchaseId?: string;
  method?: PaymentMethod;
};

export type PaymentListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};
