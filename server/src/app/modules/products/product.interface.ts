import type {
  FeedDetails,
  MedicineDetails,
  MedicineForm,
  Prisma,
  Product,
  ProductBatch,
  ProductType,
  ProductUnit,
  StockLedger,
} from '@prisma/client';

export type TProductWithRelations = Product & {
  category?: { id: string; productType: ProductType; name: string };
  medicineDetails?: MedicineDetails | null;
  feedDetails?: FeedDetails | null;
  batches?: ProductBatch[];
  ledger?: StockLedger[];
};

const toNumber = (v: unknown): number => Number(v as number | string);

export type TProductResponse = Omit<Product, 'purchasePrice' | 'sellingPrice' | 'vatPercent'> & {
  purchasePrice: number;
  sellingPrice: number;
  vatPercent: number;
  medicineDetails?: MedicineDetails | null;
  feedDetails?:
    | (Omit<FeedDetails, 'proteinPct' | 'nominalPackKg'> & {
        proteinPct: number | null;
        nominalPackKg: number | null;
      })
    | null;
  batches?: (Omit<ProductBatch, 'purchasePrice' | 'weightKg'> & {
    purchasePrice: number;
    weightKg: number | null;
  })[];
};

export const toProductResponse = (product: TProductWithRelations): TProductResponse => {
  const { medicineDetails, feedDetails, batches, ...rest } = product;
  return {
    ...rest,
    purchasePrice: toNumber((rest as Product).purchasePrice),
    sellingPrice: toNumber((rest as Product).sellingPrice),
    vatPercent: toNumber((rest as Product).vatPercent),
    ...(medicineDetails !== undefined ? { medicineDetails } : {}),
    ...(feedDetails !== undefined
      ? {
          feedDetails: feedDetails
            ? {
                ...feedDetails,
                proteinPct: feedDetails.proteinPct === null ? null : toNumber(feedDetails.proteinPct),
                nominalPackKg: feedDetails.nominalPackKg === null ? null : toNumber(feedDetails.nominalPackKg),
              }
            : null,
        }
      : {}),
    ...(batches !== undefined
      ? {
          batches: batches.map((b) => ({
            ...b,
            purchasePrice: toNumber(b.purchasePrice),
            weightKg: b.weightKg === null ? null : toNumber(b.weightKg),
          })),
        }
      : {}),
  };
};

export const ProductSearchableFields = ['name', 'description', 'sku', 'barcode', 'manufacturer'];

export interface IMedicineDetailsInput {
  form?: MedicineForm;
  genericName?: string;
  strength?: string;
  requiresPrescription?: boolean;
}

export interface IFeedDetailsInput {
  targetSpecies?: string;
  feedType?: string;
  proteinPct?: number;
  nominalPackKg?: number;
}

export interface IInitialBatchInput {
  batchNumber?: string;
  expiryDate?: string;
  stock?: number;
  purchasePrice?: number;
  weightKg?: number;
}

export interface ICreateProductPayload {
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
  medicineDetails?: IMedicineDetailsInput;
  feedDetails?: IFeedDetailsInput;
  initialBatch?: IInitialBatchInput;
}

export interface IUpdateProductPayload {
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
  medicineDetails?: IMedicineDetailsInput;
  feedDetails?: IFeedDetailsInput;
}

export type TProductInclude = Prisma.ProductInclude;
