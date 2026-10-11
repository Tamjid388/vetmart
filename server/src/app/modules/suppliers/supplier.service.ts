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

export const SupplierService = {
  create,
  getAll,
  getById,
  updateById,
  softDelete,
};
