import type { ProductFormValues } from '../types/index.ts';

export type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>;

export function validateProductForm(values: Partial<ProductFormValues>): ProductFormErrors {
  const errors: ProductFormErrors = {};

  if (!values.name?.trim()) {
    errors.name = 'Product name is required';
  }
  if (!values.category) {
    errors.category = 'Category is required';
  }
  if (!values.unit) {
    errors.unit = 'Unit is required';
  }
  if (values.purchasePrice == null || Number.isNaN(Number(values.purchasePrice))) {
    errors.purchasePrice = 'Purchase price is required';
  } else if (Number(values.purchasePrice) < 0) {
    errors.purchasePrice = 'Purchase price cannot be negative';
  }
  if (values.sellingPrice == null || Number.isNaN(Number(values.sellingPrice))) {
    errors.sellingPrice = 'Selling price is required';
  } else if (Number(values.sellingPrice) < 0) {
    errors.sellingPrice = 'Selling price cannot be negative';
  }
  if (values.minStock == null || Number.isNaN(Number(values.minStock))) {
    errors.minStock = 'Minimum stock is required';
  } else if (Number(values.minStock) < 0) {
    errors.minStock = 'Minimum stock cannot be negative';
  }
  if (values.stock == null || Number.isNaN(Number(values.stock))) {
    errors.stock = 'Stock quantity is required';
  } else if (Number(values.stock) < 0) {
    errors.stock = 'Stock quantity cannot be negative';
  }
  if (values.vatPercent != null && (Number(values.vatPercent) < 0 || Number(values.vatPercent) > 100)) {
    errors.vatPercent = 'VAT must be between 0 and 100';
  }
  if (!values.expiryDate) {
    errors.expiryDate = 'Expiry date is required';
  }

  return errors;
}

export const productSchema = {
  name: [{ required: true, message: 'Product name is required' }],
  productType: [{ required: true, message: 'Product type is required' }],
  category: [{ required: true, message: 'Category is required' }],
  // AntD Form.Item name is `categoryId` — same rule, no "ID" wording in UI.
  categoryId: [{ required: true, message: 'Category is required' }],
  unit: [{ required: true, message: 'Unit is required' }],
  purchasePrice: [
    { required: true, message: 'Purchase price is required' },
    { type: 'number' as const, min: 0, message: 'Purchase price cannot be negative' },
  ],
  sellingPrice: [
    { required: true, message: 'Selling price is required' },
    { type: 'number' as const, min: 0, message: 'Selling price cannot be negative' },
  ],
  minStock: [
    { required: true, message: 'Minimum stock is required' },
    { type: 'number' as const, min: 0, message: 'Minimum stock cannot be negative' },
  ],
  stock: [
    { required: true, message: 'Stock quantity is required' },
    { type: 'number' as const, min: 0, message: 'Stock quantity cannot be negative' },
  ],
  vatPercent: [{ type: 'number' as const, min: 0, max: 100, message: 'VAT must be between 0 and 100' }],
  expiryDate: [{ required: true, message: 'Expiry date is required' }],
  // MEDICINE lots require batchNumber; FEED lots require expiryDate (backend zod rules).
  batchNumberMedicine: [{ required: true, message: 'Batch number is required for medicine' }],
  expiryDateFeed: [{ required: true, message: 'Expiry date is required for feed' }],
  validate: validateProductForm,
};
