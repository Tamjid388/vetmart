import type { Product, ProductFormValues } from '../types/index.ts';
import productsSeed from './products.json';

const STORAGE_KEY = 'vetmart.products';

const seedProducts = productsSeed as Product[];

let cachedProducts: Product[] | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

function persist(products: Product[]) {
  const raw = JSON.stringify(products);
  localStorage.setItem(STORAGE_KEY, raw);
  cachedProducts = products;
  emit();
}

function readProducts(): Product[] {
  if (cachedProducts) return cachedProducts;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      cachedProducts = JSON.parse(raw) as Product[];
      return cachedProducts;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  cachedProducts = seedProducts;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedProducts));
  return cachedProducts;
}

function toProduct(values: ProductFormValues, id: string = crypto.randomUUID()): Product {
  return {
    id,
    name: values.name.trim(),
    category: values.category,
    unit: values.unit,
    purchasePrice: Number(values.purchasePrice),
    sellingPrice: Number(values.sellingPrice),
    stock: Number(values.stock),
    minStock: Number(values.minStock),
    expiryDate: values.expiryDate,
    vatPercent: Number(values.vatPercent ?? 0),
    description: values.description?.trim() ?? '',
    batchNumber: values.batchNumber?.trim() ?? '',
  };
}

export const productStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot() {
    return readProducts();
  },
  getServerSnapshot() {
    return seedProducts;
  },
  getById(id: string) {
    return readProducts().find((product) => product.id === id) ?? null;
  },
  create(values: ProductFormValues) {
    const product = toProduct(values);
    persist([product, ...readProducts()]);
    return product;
  },
  update(id: string, values: ProductFormValues) {
    const products = readProducts();
    const index = products.findIndex((product) => product.id === id);
    if (index === -1) return null;

    const next = [...products];
    next[index] = toProduct(values, id);
    persist(next);
    return next[index];
  },
  remove(id: string) {
    persist(readProducts().filter((product) => product.id !== id));
  },
};
