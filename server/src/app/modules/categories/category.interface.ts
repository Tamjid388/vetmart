import type { Category, ProductType } from '@prisma/client';

export type TCategoryResponse = Category & {
  productCount?: number;
};

export const toCategoryResponse = (
  category: Category & { _count?: { products: number } },
): TCategoryResponse => {
  const { _count, ...rest } = category;
  return {
    ...rest,
    ...(typeof _count?.products === 'number' ? { productCount: _count.products } : {}),
  };
};

export interface ICreateCategoryPayload {
  productType: ProductType;
  name: string;
  isActive?: boolean;
}

export interface IUpdateCategoryPayload {
  productType?: ProductType;
  name?: string;
  isActive?: boolean;
}
