export type ProductStatus =
  | 'In Stock'
  | 'Low Stock'
  | 'Critical'
  | 'Near Expiry'
  | 'Expired';

export type StockStatus = 'In Stock' | 'Low Stock' | 'Critical';

export type ExpiryStatus = 'Active' | 'Near Expiry' | 'Expired';

export type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  expiryDate: string;
  vatPercent: number;
  description: string;
  batchNumber: string;
};

export type ProductFormValues = {
  name: string;
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
  vatPercent: number;
  description: string;
  batchNumber: string;
  expiryDate: string;
  stock: number;
};

export type ProductListFilters = {
  search: string;
  stockStatus: string;
  expiry: 'all' | 'active' | 'near' | 'expired';
};
