import { Prisma } from '@prisma/client';
import type { Supplier } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/AppError.js';
import { QueryBuilder } from '../../shared/QueryBuilder.js';
import type { IQueryParams } from '../../shared/QueryBuilder.js';
import { SupplierSearchableFields } from './supplier.constant.js';
import { toSupplierResponse } from './supplier.interface.js';
import type {
  ICreateSupplierPayload,
  IUpdateSupplierPayload,
  TSupplierResponse,
} from './supplier.interface.js';

const findActiveSupplierOrThrow = async (id: string): Promise<Supplier> => {
  const supplier = await prisma.supplier.findFirst({ where: { id, isDeleted: false } });
  if (!supplier) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Supplier not found');
  }
  return supplier;
};

const throwIfPhoneConflict = (err: unknown): void => {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    throw new AppError(StatusCodes.CONFLICT, 'Phone number already exists');
  }
  throw err;
};

const create = async (payload: ICreateSupplierPayload): Promise<TSupplierResponse> => {
  try {
    const supplier = await prisma.supplier.create({
      data: {
        companyName: payload.companyName,
        phone: payload.phone,
        ...(payload.contactPerson !== undefined ? { contactPerson: payload.contactPerson } : {}),
        ...(payload.address !== undefined ? { address: payload.address } : {}),
        ...(payload.tradeLicense !== undefined ? { tradeLicense: payload.tradeLicense } : {}),
        ...(payload.paymentTerms !== undefined ? { paymentTerms: payload.paymentTerms } : {}),
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      },
    });
    return toSupplierResponse(supplier);
  } catch (err) {
    throwIfPhoneConflict(err);
    throw err;
  }
};

const getAll = async (query: IQueryParams) => {
  const qbQuery: IQueryParams = { isDeleted: false };
  if (typeof query['isActive'] === 'string') qbQuery['isActive'] = query['isActive'] === 'true';
  if (typeof query.searchTerm === 'string') qbQuery.searchTerm = query.searchTerm;
  if (typeof query.page === 'string') qbQuery.page = query.page;
  if (typeof query.limit === 'string') qbQuery.limit = query.limit;
  if (typeof query.sortBy === 'string') qbQuery.sortBy = query.sortBy;
  if (query.sortOrder === 'asc' || query.sortOrder === 'desc') qbQuery.sortOrder = query.sortOrder;

  const builder = new QueryBuilder<TSupplierResponse>(
    {
      findMany: async (args) => {
        const suppliers = await prisma.supplier.findMany(args as Prisma.SupplierFindManyArgs);
        return suppliers.map(toSupplierResponse);
      },
      count: (args) => prisma.supplier.count(args as Prisma.SupplierCountArgs),
    },
    qbQuery,
  );
  return builder.search(SupplierSearchableFields).filter().sort().paginate().execute();
};

const getById = async (id: string): Promise<TSupplierResponse> => {
  const supplier = await findActiveSupplierOrThrow(id);
  return toSupplierResponse(supplier);
};

const updateById = async (id: string, payload: IUpdateSupplierPayload): Promise<TSupplierResponse> => {
  await findActiveSupplierOrThrow(id);
  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(payload.companyName !== undefined ? { companyName: payload.companyName } : {}),
        ...(payload.contactPerson !== undefined ? { contactPerson: payload.contactPerson } : {}),
        ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
        ...(payload.address !== undefined ? { address: payload.address } : {}),
        ...(payload.tradeLicense !== undefined ? { tradeLicense: payload.tradeLicense } : {}),
        ...(payload.paymentTerms !== undefined ? { paymentTerms: payload.paymentTerms } : {}),
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      },
    });
    return toSupplierResponse(supplier);
  } catch (err) {
    throwIfPhoneConflict(err);
    throw err;
  }
};

const softDelete = async (id: string): Promise<TSupplierResponse> => {
  await findActiveSupplierOrThrow(id);
  const supplier = await prisma.supplier.update({
    where: { id },
    data: { isDeleted: true },
  });
  return toSupplierResponse(supplier);
};

/**
 * Lightweight args for the searchable supplier dropdown.
 * Non-deleted suppliers only, id/companyName/phone, companyName-sorted.
 */
export const buildSupplierDropdownArgs = (query: { searchTerm?: string; limit?: string }) => {
  const where: { isDeleted: boolean; OR?: { companyName?: object; phone?: object }[] } = {
    isDeleted: false,
  };
  if (typeof query.searchTerm === 'string' && query.searchTerm.trim()) {
    const term = query.searchTerm.trim();
    where.OR = [{ companyName: { contains: term, mode: 'insensitive' } }, { phone: { contains: term } }];
  }
  let take = 20;
  if (typeof query.limit === 'string') {
    const parsed = Number.parseInt(query.limit, 10);
    if (Number.isFinite(parsed)) take = Math.min(50, Math.max(1, parsed));
  }
  return {
    where,
    orderBy: { companyName: 'asc' } as const,
    take,
    select: { id: true, companyName: true, phone: true } as const,
  };
};

export type TSupplierDropdownItem = {
  id: string;
  companyName: string;
  phone: string;
};

const getDropdown = async (query: { searchTerm?: string; limit?: string }): Promise<TSupplierDropdownItem[]> => {
  const args = buildSupplierDropdownArgs(query);
  return prisma.supplier.findMany(args);
};

export const SupplierService = {
  create,
  getAll,
  getDropdown,
  getById,
  updateById,
  softDelete,
};
