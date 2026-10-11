import type { Product, ProductBatch, Purchase, PurchaseItem, SalePaymentMethod, Supplier } from '@prisma/client';

export interface IPurchaseItemInput {
  productId: string;
  qty: number;
  /** Lot cost per sale unit for this GRN line (>= 0; 0 = free goods). */
  purchasePrice: number;
  batchNumber?: string;
  /** Required per line (same owner rule as product create). */
  expiryDate: string;
  weightKg?: number;
}

export interface ICreatePurchasePayload {
  idempotencyKey: string;
  supplierId: string;
  items: IPurchaseItemInput[];
  discount?: number;
  paymentMethod?: SalePaymentMethod | null;
  paidAmount: number;
  notes?: string;
}

export type TPurchaseSupplier = Pick<Supplier, 'id' | 'companyName' | 'phone'>;

export type TPurchaseItemProduct = Pick<Product, 'id' | 'name' | 'unit'>;

export type TPurchaseItemBatch = Pick<ProductBatch, 'id' | 'batchNumber' | 'expiryDate'>;

export type TPurchaseItemResponse = Omit<
  PurchaseItem,
  'purchasePrice' | 'sellingPrice' | 'vatPercent' | 'lineTotal' | 'weightKg' | 'expiryDate'
> & {
  purchasePrice: number;
  sellingPrice: number;
  vatPercent: number;
  lineTotal: number;
  weightKg: number | null;
  expiryDate: string | null;
  product?: TPurchaseItemProduct;
  batch?: TPurchaseItemBatch | null;
};

export type TPurchaseResponse = Omit<
  Purchase,
  'subtotal' | 'discount' | 'vatTotal' | 'grandTotal' | 'paidAmount' | 'dueAmount'
> & {
  subtotal: number;
  discount: number;
  vatTotal: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  supplier?: TPurchaseSupplier;
  items: TPurchaseItemResponse[];
};

export type TPopulatedPurchaseItem = PurchaseItem & {
  product?: TPurchaseItemProduct | null;
  batch?: TPurchaseItemBatch | null;
};

export type TPopulatedPurchase = Purchase & {
  supplier?: TPurchaseSupplier | null;
  items: TPopulatedPurchaseItem[];
};

const toNumber = (v: unknown): number => Number(v as number | string);

export const toPurchaseItemResponse = (item: TPopulatedPurchaseItem): TPurchaseItemResponse => {
  const { purchasePrice, sellingPrice, vatPercent, lineTotal, weightKg, expiryDate, product, batch, ...rest } = item;
  void purchasePrice;
  void sellingPrice;
  void vatPercent;
  void lineTotal;
  void weightKg;
  void expiryDate;
  return {
    ...rest,
    purchasePrice: toNumber(item.purchasePrice),
    sellingPrice: toNumber(item.sellingPrice),
    vatPercent: toNumber(item.vatPercent),
    lineTotal: toNumber(item.lineTotal),
    weightKg: item.weightKg === null || item.weightKg === undefined ? null : toNumber(item.weightKg),
    expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString() : null,
    ...(product ? { product } : {}),
    ...(batch ? { batch } : {}),
  };
};

export const toPurchaseResponse = (purchase: TPopulatedPurchase): TPurchaseResponse => {
  const { subtotal, discount, vatTotal, grandTotal, paidAmount, dueAmount, items, supplier, ...rest } = purchase;
  void subtotal;
  void discount;
  void vatTotal;
  void grandTotal;
  void paidAmount;
  void dueAmount;
  return {
    ...rest,
    subtotal: toNumber(purchase.subtotal),
    discount: toNumber(purchase.discount),
    vatTotal: toNumber(purchase.vatTotal),
    grandTotal: toNumber(purchase.grandTotal),
    paidAmount: toNumber(purchase.paidAmount),
    dueAmount: toNumber(purchase.dueAmount),
    ...(supplier ? { supplier } : {}),
    items: items.map(toPurchaseItemResponse),
  };
};
