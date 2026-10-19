export type ReportTabKey =
  | 'sales'
  | 'purchases'
  | 'profit'
  | 'customer-dues'
  | 'vendor-dues'
  | 'stock'
  | 'expiry';

export type ReportListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};

export type ReportRange = {
  from: string | null;
  to: string | null;
};

export type ReportOverview = {
  range: ReportRange;
  sales: { count: number; grandTotal: number; paidTotal: number; dueTotal: number };
  purchases: { count: number; grandTotal: number; paidTotal: number; dueTotal: number };
  profit: { revenue: number; cogs: number; grossProfit: number };
  dues: { customerDue: number; customerCount: number; vendorDue: number; vendorCount: number };
  stock: { products: number; stockValue: number; lowCount: number; criticalCount: number };
  expiry: { expiredBatches: number; nearExpiryBatches: number };
};

export type SalesReportRow = {
  id: string;
  invoiceNo: string;
  saleDate: string;
  customerId: string | null;
  customerName: string | null;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  itemCount: number;
};

export type PurchaseReportRow = {
  id: string;
  invoiceNo: string;
  purchaseDate: string;
  supplierId: string;
  supplierName: string | null;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: string;
  itemCount: number;
};

export type ProfitSummary = {
  range: ReportRange;
  revenue: number;
  cogs: number;
  grossProfit: number;
  discount: number;
  vatTotal: number;
  transactionCount: number;
  avgOrderValue: number;
};

export type ProfitByProductRow = {
  productId: string;
  productName: string;
  unit: string;
  qtySold: number;
  revenue: number;
  cogs: number;
  profit: number;
};

export type CustomerDueRow = {
  id: string;
  name: string;
  phone: string;
  area: string | null;
  category: string | null;
  dueBalance: number;
};

export type VendorDueRow = {
  id: string;
  companyName: string;
  phone: string;
  payableBalance: number;
};

export type StockReportRow = {
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
};

export type ExpiryReportRow = {
  batchId: string;
  productId: string;
  productName: string;
  sku: string | null;
  batchNumber: string | null;
  expiryDate: string;
  stock: number;
  status: 'Expired' | 'Near Expiry';
  daysLeft: number;
};

export type ReportQueryParams = {
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
  paymentStatus?: string;
  area?: string;
  productType?: string;
  stockStatus?: string;
  expiryStatus?: string;
  days?: number;
  page?: number;
  limit?: number;
  sortOrder?: 'asc' | 'desc';
};
