export type ProductType = 'MEDICINE' | 'FEED';

export type ProductUnit =
  | 'PIECE'
  | 'STRIP'
  | 'BOTTLE'
  | 'BOX'
  | 'VIAL'
  | 'AMPOULE'
  | 'TUBE'
  | 'SACHET'
  | 'BAG'
  | 'KG'
  | 'LITER'
  | 'OTHER';

export type MedicineForm =
  | 'TABLET'
  | 'CAPSULE'
  | 'SYRUP'
  | 'INJECTION'
  | 'CREAM'
  | 'OINTMENT'
  | 'POWDER'
  | 'DROPS'
  | 'SUSPENSION'
  | 'SOLUTION'
  | 'OTHER';

export type ProductCategory = {
  id: string;
  productType: ProductType;
  name: string;
};

export type MedicineDetails = {
  id: string;
  productId: string;
  form?: MedicineForm | null;
  genericName?: string | null;
  strength?: string | null;
  requiresPrescription?: boolean | null;
};

export type FeedDetails = {
  id: string;
  productId: string;
  targetSpecies?: string | null;
  feedType?: string | null;
  proteinPct?: number | null;
  nominalPackKg?: number | null;
};

export type ProductBatch = {
  id: string;
  productId: string;
  batchNumber: string | null;
  expiryDate: Date | null;
  purchasePrice: number;
  stock: number;
  weightKg: number | null;
  receivedAt: Date;
};

export type ProductResponse = {
  id: string;
  productType: ProductType;
  name: string;
  description?: string | null;
  categoryId: string;
  unit: ProductUnit;
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
  vatPercent: number;
  manufacturer?: string | null;
  sku?: string | null;
  barcode?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: ProductCategory | null;
  medicineDetails?: MedicineDetails | null;
  feedDetails?: FeedDetails | null;
  batches?: ProductBatch[];
};

export type CreateProductPayload = {
  productType: ProductType;
  name: string;
  description?: string;
  categoryId: string;
  unit: ProductUnit;
  purchasePrice: number;
  sellingPrice: number;
  minStock?: number;
  vatPercent?: number;
  manufacturer?: string;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
  isActive?: boolean;
  medicineDetails?: {
    form?: MedicineForm;
    genericName?: string;
    strength?: string;
    requiresPrescription?: boolean;
  };
  feedDetails?: {
    targetSpecies?: string;
    feedType?: string;
    proteinPct?: number;
    nominalPackKg?: number;
  };
  initialBatch?: {
    batchNumber?: string;
    expiryDate?: string;
    stock?: number;
    purchasePrice?: number;
    weightKg?: number;
  };
};

export type UpdateProductPayload = {
  name?: string;
  description?: string;
  categoryId?: string;
  unit?: ProductUnit;
  purchasePrice?: number;
  sellingPrice?: number;
  minStock?: number;
  vatPercent?: number;
  manufacturer?: string;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
  isActive?: boolean;
  medicineDetails?: {
    form?: MedicineForm;
    genericName?: string;
    strength?: string;
    requiresPrescription?: boolean;
  };
  feedDetails?: {
    targetSpecies?: string;
    feedType?: string;
    proteinPct?: number;
    nominalPackKg?: number;
  };
};

export type ProductListQueryParams = {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  productType?: ProductType;
  categoryId?: string;
  unit?: ProductUnit;
  isActive?: boolean;
  manufacturer?: string;
};

export type ProductListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};
