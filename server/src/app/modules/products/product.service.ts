import type { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/AppError.js';
import { QueryBuilder } from '../../shared/QueryBuilder.js';
import type { IQueryParams } from '../../shared/QueryBuilder.js';
import { ProductSearchableFields, toProductResponse } from './product.interface.js';
import type {
  ICreateProductPayload,
  IUpdateProductPayload,
  TProductResponse,
  TProductWithRelations,
} from './product.interface.js';

const productInclude = {
  category: { select: { id: true, productType: true, name: true } },
  medicineDetails: true,
  feedDetails: true,
  batches: { orderBy: { receivedAt: 'asc' as const } },
} satisfies Prisma.ProductInclude;

const findActiveProductOrThrow = async (id: string): Promise<TProductWithRelations> => {
  const product = (await prisma.product.findFirst({
    where: { id, isDeleted: false },
    include: productInclude,
  })) as unknown as TProductWithRelations | null;
  if (!product) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Product not found');
  }
  return product;
};

const assertCategoryMatches = async (categoryId: string, productType: 'MEDICINE' | 'FEED') => {
  const category = await prisma.category.findFirst({ where: { id: categoryId, isActive: true } });
  if (!category) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Category not found');
  }
  if (category.productType !== productType) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Category "${category.name}" is ${category.productType}, cannot be used for ${productType} product`,
    );
  }
  return category;
};

const create = async (payload: ICreateProductPayload): Promise<TProductResponse> => {
  await assertCategoryMatches(payload.categoryId, payload.productType);

  const initialStock = payload.initialBatch?.stock ?? 0;
  const batchPurchasePrice = payload.initialBatch?.purchasePrice ?? payload.purchasePrice;
  const expiryRaw = payload.initialBatch?.expiryDate;
  const expiryDate = expiryRaw ? new Date(expiryRaw) : null;
  if (expiryRaw && (expiryDate === null || Number.isNaN(expiryDate.getTime()))) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid expiryDate');
  }

  const med = payload.medicineDetails;
  const feed = payload.feedDetails;

  const product = await prisma.$transaction(async (tx) => {
    const created = (await tx.product.create({
      data: {
        productType: payload.productType,
        name: payload.name,
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        category: { connect: { id: payload.categoryId } },
        unit: payload.unit,
        purchasePrice: payload.purchasePrice,
        sellingPrice: payload.sellingPrice,
        minStock: payload.minStock ?? 0,
        vatPercent: payload.vatPercent ?? 0,
        ...(payload.manufacturer !== undefined ? { manufacturer: payload.manufacturer } : {}),
        ...(payload.sku !== undefined ? { sku: payload.sku } : {}),
        ...(payload.barcode !== undefined ? { barcode: payload.barcode } : {}),
        ...(payload.imageUrl !== undefined ? { imageUrl: payload.imageUrl } : {}),
        isActive: payload.isActive ?? true,
        ...(payload.productType === 'MEDICINE'
          ? {
              medicineDetails: {
                create: {
                  ...(med?.form !== undefined ? { form: med.form } : {}),
                  ...(med?.genericName !== undefined ? { genericName: med.genericName } : {}),
                  ...(med?.strength !== undefined ? { strength: med.strength } : {}),
                  ...(med?.requiresPrescription !== undefined
                    ? { requiresPrescription: med.requiresPrescription }
                    : {}),
                },
              },
            }
          : {}),
        ...(payload.productType === 'FEED'
          ? {
              feedDetails: {
                create: {
                  ...(feed?.targetSpecies !== undefined ? { targetSpecies: feed.targetSpecies } : {}),
                  ...(feed?.feedType !== undefined ? { feedType: feed.feedType } : {}),
                  ...(feed?.proteinPct !== undefined ? { proteinPct: feed.proteinPct } : {}),
                  ...(feed?.nominalPackKg !== undefined ? { nominalPackKg: feed.nominalPackKg } : {}),
                },
              },
            }
          : {}),
      },
      include: productInclude,
    })) as unknown as TProductWithRelations;

    // Every product gets one OPENING lot so stock (= sum lots) starts correctly.
    // Service invariant: ledger.productId MUST equal batch.productId.
    if (payload.initialBatch) {
      const batch = await tx.productBatch.create({
        data: {
          productId: created.id,
          ...(payload.initialBatch.batchNumber !== undefined
            ? { batchNumber: payload.initialBatch.batchNumber }
            : { batchNumber: null }),
          ...(expiryDate ? { expiryDate } : { expiryDate: null }),
          purchasePrice: batchPurchasePrice,
          stock: initialStock,
          ...(payload.initialBatch.weightKg !== undefined ? { weightKg: payload.initialBatch.weightKg } : {}),
        },
      });
      await tx.stockLedger.create({
        data: {
          productId: created.id,
          batchId: batch.id,
          type: 'OPENING',
          qtyDelta: initialStock,
          stockAfter: initialStock,
        },
      });
      const withBatch = (await tx.product.findFirst({
        where: { id: created.id },
        include: productInclude,
      })) as unknown as TProductWithRelations;
      return withBatch ?? created;
    }

    return created;
  });

  return toProductResponse(product);
};

const getAll = async (query: IQueryParams) => {
  const qbQuery: IQueryParams = { isDeleted: false };
  if (typeof query['productType'] === 'string') qbQuery['productType'] = query['productType'];
  if (typeof query['categoryId'] === 'string') qbQuery['categoryId'] = query['categoryId'];
  if (typeof query['category'] === 'string') qbQuery['categoryId'] = query['category'];
  if (typeof query['unit'] === 'string') qbQuery['unit'] = query['unit'];
  if (typeof query['isActive'] === 'string') qbQuery['isActive'] = query['isActive'] === 'true';
  if (typeof query['manufacturer'] === 'string') qbQuery['manufacturer'] = query['manufacturer'];
  if (typeof query.searchTerm === 'string') qbQuery.searchTerm = query.searchTerm;
  if (typeof query.page === 'string') qbQuery.page = query.page;
  if (typeof query.limit === 'string') qbQuery.limit = query.limit;
  if (typeof query.sortBy === 'string') qbQuery.sortBy = query.sortBy;
  if (query.sortOrder === 'asc' || query.sortOrder === 'desc') qbQuery.sortOrder = query.sortOrder;

  const builder = new QueryBuilder<TProductResponse>(
    {
      findMany: async (args) => {
        const products = (await prisma.product.findMany({
          ...((args as Prisma.ProductFindManyArgs).where ? { where: (args as Prisma.ProductFindManyArgs).where } : {}),
          ...((args as Prisma.ProductFindManyArgs).orderBy
            ? { orderBy: (args as Prisma.ProductFindManyArgs).orderBy }
            : {}),
          ...((args as Prisma.ProductFindManyArgs).skip !== undefined
            ? { skip: (args as Prisma.ProductFindManyArgs).skip }
            : {}),
          ...((args as Prisma.ProductFindManyArgs).take !== undefined
            ? { take: (args as Prisma.ProductFindManyArgs).take }
            : {}),
          include: productInclude,
        })) as unknown as TProductWithRelations[];
        return products.map(toProductResponse);
      },
      count: (args) => prisma.product.count(args as Prisma.ProductCountArgs),
    },
    qbQuery,
  );
  // NOTE: .fields() intentionally skipped — partial select breaks Decimal→number mapping + includes.
  return builder.search(ProductSearchableFields).filter().sort().paginate().execute();
};

const getById = async (id: string): Promise<TProductResponse> => {
  const product = await findActiveProductOrThrow(id);
  return toProductResponse(product);
};

const updateById = async (id: string, payload: IUpdateProductPayload): Promise<TProductResponse> => {
  const existing = await findActiveProductOrThrow(id);
  if (payload.categoryId) {
    await assertCategoryMatches(payload.categoryId, existing.productType);
  }
  if (payload.medicineDetails && existing.productType !== 'MEDICINE') {
    throw new AppError(StatusCodes.BAD_REQUEST, 'medicineDetails is only allowed for MEDICINE products');
  }
  if (payload.feedDetails && existing.productType !== 'FEED') {
    throw new AppError(StatusCodes.BAD_REQUEST, 'feedDetails is only allowed for FEED products');
  }

  const med = payload.medicineDetails;
  const feed = payload.feedDetails;

  const updated = (await prisma.product.update({
    where: { id },
    data: {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.description !== undefined ? { description: payload.description } : {}),
      ...(payload.categoryId !== undefined ? { category: { connect: { id: payload.categoryId } } } : {}),
      ...(payload.unit !== undefined ? { unit: payload.unit } : {}),
      ...(payload.purchasePrice !== undefined ? { purchasePrice: payload.purchasePrice } : {}),
      ...(payload.sellingPrice !== undefined ? { sellingPrice: payload.sellingPrice } : {}),
      ...(payload.minStock !== undefined ? { minStock: payload.minStock } : {}),
      ...(payload.vatPercent !== undefined ? { vatPercent: payload.vatPercent } : {}),
      ...(payload.manufacturer !== undefined ? { manufacturer: payload.manufacturer } : {}),
      ...(payload.sku !== undefined ? { sku: payload.sku } : {}),
      ...(payload.barcode !== undefined ? { barcode: payload.barcode } : {}),
      ...(payload.imageUrl !== undefined ? { imageUrl: payload.imageUrl } : {}),
      ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      ...(med
        ? {
            medicineDetails: {
              upsert: {
                create: {
                  ...(med.form !== undefined ? { form: med.form } : {}),
                  ...(med.genericName !== undefined ? { genericName: med.genericName } : {}),
                  ...(med.strength !== undefined ? { strength: med.strength } : {}),
                  ...(med.requiresPrescription !== undefined ? { requiresPrescription: med.requiresPrescription } : {}),
                },
                update: {
                  ...(med.form !== undefined ? { form: med.form } : {}),
                  ...(med.genericName !== undefined ? { genericName: med.genericName } : {}),
                  ...(med.strength !== undefined ? { strength: med.strength } : {}),
                  ...(med.requiresPrescription !== undefined ? { requiresPrescription: med.requiresPrescription } : {}),
                },
              },
            },
          }
        : {}),
      ...(feed
        ? {
            feedDetails: {
              upsert: {
                create: {
                  ...(feed.targetSpecies !== undefined ? { targetSpecies: feed.targetSpecies } : {}),
                  ...(feed.feedType !== undefined ? { feedType: feed.feedType } : {}),
                  ...(feed.proteinPct !== undefined ? { proteinPct: feed.proteinPct } : {}),
                  ...(feed.nominalPackKg !== undefined ? { nominalPackKg: feed.nominalPackKg } : {}),
                },
                update: {
                  ...(feed.targetSpecies !== undefined ? { targetSpecies: feed.targetSpecies } : {}),
                  ...(feed.feedType !== undefined ? { feedType: feed.feedType } : {}),
                  ...(feed.proteinPct !== undefined ? { proteinPct: feed.proteinPct } : {}),
                  ...(feed.nominalPackKg !== undefined ? { nominalPackKg: feed.nominalPackKg } : {}),
                },
              },
            },
          }
        : {}),
    },
    include: productInclude,
  })) as unknown as TProductWithRelations;
  return toProductResponse(updated);
};

const softDelete = async (id: string): Promise<TProductResponse> => {
  await findActiveProductOrThrow(id);
  const product = (await prisma.product.update({
    where: { id },
    data: { isDeleted: true },
    include: productInclude,
  })) as unknown as TProductWithRelations;
  return toProductResponse(product);
};

export const ProductService = {
  create,
  getAll,
  getById,
  updateById,
  softDelete,
};
