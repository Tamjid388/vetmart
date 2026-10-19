export interface IReportRange {
  from: string | null;
  to: string | null;
}

export interface IReportFilters {
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  paymentStatus?: 'PAID' | 'PARTIAL' | 'DUE';
  area?: string;
  productType?: 'MEDICINE' | 'FEED';
  stockStatus?: 'In Stock' | 'Low Stock' | 'Critical';
  expiryStatus?: 'Expired' | 'Near Expiry';
  /** Near-expiry window override (days). */
  days?: string;
  page?: string;
  limit?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IReportOverview {
  range: IReportRange;
  sales: { count: number; grandTotal: number; paidTotal: number; dueTotal: number };
  purchases: { count: number; grandTotal: number; paidTotal: number; dueTotal: number };
  profit: { revenue: number; cogs: number; grossProfit: number };
  dues: { customerDue: number; customerCount: number; vendorDue: number; vendorCount: number };
  stock: { products: number; stockValue: number; lowCount: number; criticalCount: number };
  expiry: { expiredBatches: number; nearExpiryBatches: number };
}

export interface ISalesReportRow {
  id: string;
  invoiceNo: string;
  saleDate: Date;
  customerId: string | null;
  customerName: string | null;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  itemCount: number;
}

export interface IPurchaseReportRow {
  id: string;
  invoiceNo: string;
  purchaseDate: Date;
  supplierId: string;
  supplierName: string | null;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  itemCount: number;
}

export interface IProfitSummary {
  range: IReportRange;
  revenue: number;
  cogs: number;
  grossProfit: number;
  discount: number;
  vatTotal: number;
  transactionCount: number;
  avgOrderValue: number;
}

export interface IProfitByProductRow {
  productId: string;
  productName: string;
  unit: string;
  qtySold: number;
  revenue: number;
  cogs: number;
  profit: number;
}

export interface ICustomerDueRow {
  id: string;
  name: string;
  phone: string;
  area: string | null;
  category: string | null;
  dueBalance: number;
}

export interface IVendorDueRow {
  id: string;
  companyName: string;
  phone: string;
  payableBalance: number;
}

export interface IStockReportRow {
  id: string;
  name: string;
  sku: string | null;
  productType: string;
  unit: string;
  stock: number;
  minStock: number;
  stockStatus: 'In Stock' | 'Low Stock' | 'Critical';
  stockValue: number;
  earliestExpiry: string | null;
}

export interface IExpiryReportRow {
  batchId: string;
  productId: string;
  productName: string;
  sku: string | null;
  batchNumber: string | null;
  expiryDate: string;
  stock: number;
  status: 'Expired' | 'Near Expiry';
  daysLeft: number;
}
