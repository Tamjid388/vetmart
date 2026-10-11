import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/AppError.js';
import { QueryBuilder } from '../../shared/QueryBuilder.js';
import type { IQueryParams } from '../../shared/QueryBuilder.js';
import { CategorySearchableFields } from './category.constant.js';
import { toCategoryResponse } from './category.interface.js';
import type {
  ICreateCategoryPayload,
  IUpdateCategoryPayload,
  TCategoryResponse,
} from './category.interface.js';

const throwIfNameConflict = (err: unknown): void => {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    throw new AppError(StatusCodes.CONFLICT, 'Category already exists for this product type');
  }
};

// productCount must reflect live products only — Category has no isDeleted
// column, but Product does, so _count is filtered (guards use the same filter).
const liveCountInclude = {
  _count: { select: { products: { where: { isDeleted: false } } } },
} satisfies Prisma.CategoryInclude;

const findCategoryOrThrow = async (id: string) => {
  const category = await prisma.category.findFirst({
    where: { id },
    include: liveCountInclude,
  });
  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Category not found');
  }
  return category;
};

const create = async (payload: ICreateCategoryPayload): Promise<TCategoryResponse> => {
  try {
    const category = await prisma.category.create({
      data: {
        productType: payload.productType,
        name: payload.name.trim(),
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      },
      include: liveCountInclude,
    });
    return toCategoryResponse(category);
  } catch (err) {
    throwIfNameConflict(err);
    throw err;
  }
};

const getAll = async (query: IQueryParams) => {
  const qbQuery: IQueryParams = {};
  if (typeof query['productType'] === 'string') qbQuery['productType'] = query['productType'];
  if (typeof query['isActive'] === 'string') qbQuery['isActive'] = query['isActive'] === 'true';
  if (typeof query.searchTerm === 'string') qbQuery.searchTerm = query.searchTerm;
  if (typeof query.page === 'string') qbQuery.page = query.page;
  if (typeof query.limit === 'string') qbQuery.limit = query.limit;
  if (typeof query.sortBy === 'string') qbQuery.sortBy = query.sortBy;
  if (query.sortOrder === 'asc' || query.sortOrder === 'desc') qbQuery.sortOrder = query.sortOrder;
  else qbQuery.sortOrder = 'asc';

  const builder = new QueryBuilder<TCategoryResponse>(
    {
      findMany: async (args) => {
        const categories = await prisma.category.findMany({
          ...((args as Prisma.CategoryFindManyArgs).where
            ? { where: (args as Prisma.CategoryFindManyArgs).where }
            : {}),
          ...((args as Prisma.CategoryFindManyArgs).orderBy
            ? { orderBy: (args as Prisma.CategoryFindManyArgs).orderBy }
            : { orderBy: { name: 'asc' as const } }),
          ...((args as Prisma.CategoryFindManyArgs).skip !== undefined
            ? { skip: (args as Prisma.CategoryFindManyArgs).skip }
            : {}),
          ...((args as Prisma.CategoryFindManyArgs).take !== undefined
            ? { take: (args as Prisma.CategoryFindManyArgs).take }
            : {}),
          include: liveCountInclude,
        });
        return categories.map(toCategoryResponse);
      },
      count: (args) => prisma.category.count(args as Prisma.CategoryCountArgs),
    },
    qbQuery,
  );
  return builder.search(CategorySearchableFields).filter().sort('name').paginate().execute();
};

const getById = async (id: string): Promise<TCategoryResponse> => {
  const category = await findCategoryOrThrow(id);
  return toCategoryResponse(category);
};

const updateById = async (id: string, payload: IUpdateCategoryPayload): Promise<TCategoryResponse> => {
  const existing = await findCategoryOrThrow(id);

  // Changing productType while products use this category would break
  // the product.service invariant (category.productType == product.productType).
  if (payload.productType && payload.productType !== existing.productType) {
    const inUse = await prisma.product.count({ where: { categoryId: id, isDeleted: false } });
    if (inUse > 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Cannot move category to ${payload.productType} — ${inUse} product(s) still use it`,
      );
    }
  }

  // Same guard as softDelete: deactivating via PATCH must not orphan live products.
  if (payload.isActive === false && existing.isActive) {
    const inUse = await prisma.product.count({ where: { categoryId: id, isDeleted: false } });
    if (inUse > 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Cannot deactivate category — ${inUse} product(s) still use it`,
      );
    }
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(payload.productType !== undefined ? { productType: payload.productType } : {}),
        ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      },
      include: liveCountInclude,
    });
    return toCategoryResponse(category);
  } catch (err) {
    throwIfNameConflict(err);
    throw err;
  }
};

// Categories have no isDeleted column — "delete" means deactivate (hide without deleting).
// Guarded: a category with live products cannot be deactivated.
const softDelete = async (id: string): Promise<TCategoryResponse> => {
  const existing = await findCategoryOrThrow(id);
  if (!existing.isActive) {
    return toCategoryResponse(existing);
  }
  const inUse = await prisma.product.count({ where: { categoryId: id, isDeleted: false } });
  if (inUse > 0) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Cannot deactivate category — ${inUse} product(s) still use it`,
    );
  }
  const category = await prisma.category.update({
    where: { id },
    data: { isActive: false },
    include: liveCountInclude,
  });
  return toCategoryResponse(category);
};

export const CategoryService = {
  create,
  getAll,
  getById,
  updateById,
  softDelete,
};
