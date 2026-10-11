import type {
  Customer,
  Product,
  ProductBatch,
  Sale,
  SaleItem,
  SalePaymentMethod,
  SaleType,
} from '@prisma/client';
import type { TUserRole } from '../users/user.constant.js';

export type { SaleType };

export type TSaleRole = TUserRole;

export interface ISaleItemInput {
  productId: string;
  qty: number;
}

export interface ICreateSalePayload {
  idempotencyKey: string;
  saleType: SaleType;
  /** Required for REGISTERED sales; must be absent for CASH sales. */
  customerId?: string;
  items: ISaleItemInput[];
  discount?: number;
  paymentMethod?: SalePaymentMethod | null;
  paidAmount: number;
  notes?: string;
}

export type TSaleCustomer = Pick<Customer, 'id' | 'name' | 'phone'>;

export type TSaleItemProduct = Pick<Product, 'id' | 'name' | 'unit'>;

export type TSaleItemBatch = Pick<ProductBatch, 'id' | 'batchNumber' | 'expiryDate'>;

export type TSaleItemResponse = Omit<
  SaleItem,
  'sellingPrice' | 'purchasePrice' | 'vatPercent' | 'lineTotal'
> & {
  sellingPrice: number;
  /** Lot cost snapshot — admin only, omitted for staff. */
  purchasePrice?: number;
  vatPercent: number;
  lineTotal: number;
  product?: TSaleItemProduct;
  batch?: TSaleItemBatch | null;
};

export type TSaleResponse = Omit<
  Sale,
  'subtotal' | 'discount' | 'vatTotal' | 'grandTotal' | 'paidAmount' | 'dueAmount'
> & {
  subtotal: number;
  discount: number;
  vatTotal: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  customer?: TSaleCustomer;
  items: TSaleItemResponse[];
};

export type TPopulatedSaleItem = SaleItem & {
  product?: TSaleItemProduct | null;
  batch?: TSaleItemBatch | null;
};

export type TPopulatedSale = Sale & {
  customer?: TSaleCustomer | null;
  items: TPopulatedSaleItem[];
};

const toNumber = (v: unknown): number => Number(v as number | string);

export const toSaleItemResponse = (item: TPopulatedSaleItem, role: TSaleRole): TSaleItemResponse => {
  const { sellingPrice, purchasePrice, vatPercent, lineTotal, product, batch, ...rest } = item;
  void purchasePrice;
  return {
    ...rest,
    sellingPrice: toNumber(sellingPrice),
    ...(role === 'admin' ? { purchasePrice: toNumber(item.purchasePrice) } : {}),
    vatPercent: toNumber(vatPercent),
    lineTotal: toNumber(lineTotal),
    ...(product ? { product } : {}),
    ...(batch ? { batch } : {}),
  };
};

export const toSaleResponse = (sale: TPopulatedSale, role: TSaleRole): TSaleResponse => {
  const { subtotal, discount, vatTotal, grandTotal, paidAmount, dueAmount, items, customer, ...rest } =
    sale;
  void subtotal;
  void discount;
  void vatTotal;
  void grandTotal;
  void paidAmount;
  void dueAmount;
  return {
    ...rest,
    subtotal: toNumber(sale.subtotal),
    discount: toNumber(sale.discount),
    vatTotal: toNumber(sale.vatTotal),
    grandTotal: toNumber(sale.grandTotal),
    paidAmount: toNumber(sale.paidAmount),
    dueAmount: toNumber(sale.dueAmount),
    ...(customer ? { customer } : {}),
    items: items.map((item) => toSaleItemResponse(item, role)),
  };
};

export interface IShortStockLine {
  productId: string;
  productName: string;
  requested: number;
  available: number;
  expiredOnly: boolean;
}
