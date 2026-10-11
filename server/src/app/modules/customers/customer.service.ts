import { Prisma } from '@prisma/client';
import type { Customer } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/AppError.js';
import { QueryBuilder } from '../../shared/QueryBuilder.js';
import type { IQueryParams } from '../../shared/QueryBuilder.js';
import { CustomerSearchableFields } from './customer.constant.js';
import { normalizeArea, toStoredArea } from '../../shared/normalize.js';
import { toCustomerResponse } from './customer.interface.js';
import type { ICreateCustomerPayload, IUpdateCustomerPayload, TCustomerResponse } from './customer.interface.js';

const findActiveCustomerOrThrow = async (id: string): Promise<Customer> => {
  const customer = await prisma.customer.findFirst({ where: { id, isDeleted: false } });
  if (!customer) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Customer not found');
  }
  return customer;
};

const throwIfPhoneConflict = (err: unknown): void => {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    throw new AppError(StatusCodes.CONFLICT, 'Phone number already exists');
  }
  throw err;
};

const create = async (payload: ICreateCustomerPayload): Promise<TCustomerResponse> => {
  try {
    const area = toStoredArea(payload.area);
    const customer = await prisma.customer.create({
      data: {
        name: payload.name,
        phone: payload.phone,
        ...(payload.address !== undefined ? { address: payload.address } : {}),
        ...(area !== undefined ? { area } : {}),
        ...(payload.category !== undefined ? { category: payload.category } : {}),
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      },
    });
    return toCustomerResponse(customer);
  } catch (err) {
    throwIfPhoneConflict(err);
    throw err;
  }
};

const getAll = async (query: IQueryParams) => {
  const qbQuery: IQueryParams = { isDeleted: false };
  if (typeof query['isActive'] === 'string') qbQuery['isActive'] = query['isActive'] === 'true';
  // Stored areas are lowercase (see toStoredArea) and the filter is an
  // exact match, so the incoming value must be normalized identically —
  // otherwise `?area=Mirpur` would miss rows stored as `mirpur`.
  if (typeof query['area'] === 'string') qbQuery['area'] = normalizeArea(query['area']);
  if (typeof query['category'] === 'string') qbQuery['category'] = query['category'];
  if (typeof query.searchTerm === 'string') qbQuery.searchTerm = query.searchTerm;
  if (typeof query.page === 'string') qbQuery.page = query.page;
  if (typeof query.limit === 'string') qbQuery.limit = query.limit;
  if (typeof query.sortBy === 'string') qbQuery.sortBy = query.sortBy;
  if (query.sortOrder === 'asc' || query.sortOrder === 'desc') qbQuery.sortOrder = query.sortOrder;

  const builder = new QueryBuilder<TCustomerResponse>(
    {
      findMany: async (args) => {
        const customers = await prisma.customer.findMany(args as Prisma.CustomerFindManyArgs);
        return customers.map(toCustomerResponse);
      },
      count: (args) => prisma.customer.count(args as Prisma.CustomerCountArgs),
    },
    qbQuery,
  );
  return builder.search(CustomerSearchableFields).filter().sort().paginate().execute();
};

const getById = async (id: string): Promise<TCustomerResponse> => {
  const customer = await findActiveCustomerOrThrow(id);
  return toCustomerResponse(customer);
};

const updateById = async (id: string, payload: IUpdateCustomerPayload): Promise<TCustomerResponse> => {
  await findActiveCustomerOrThrow(id);
  try {
    const area = toStoredArea(payload.area);
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
        ...(payload.address !== undefined ? { address: payload.address } : {}),
        ...(area !== undefined ? { area } : {}),
        ...(payload.category !== undefined ? { category: payload.category } : {}),
        ...(payload.isActive !== undefined ? { isActive: payload.isActive } : {}),
      },
    });
    return toCustomerResponse(customer);
  } catch (err) {
    throwIfPhoneConflict(err);
    throw err;
  }
};

const softDelete = async (id: string): Promise<TCustomerResponse> => {
  await findActiveCustomerOrThrow(id);
  const customer = await prisma.customer.update({
    where: { id },
    data: { isDeleted: true },
  });
  return toCustomerResponse(customer);
};

/**
 * Distinct area names for the customer form suggestions.
 * Values are normalized on read too, so legacy mixed-case rows
 * (`Mirpur` next to `mirpur`) collapse into one entry even before
 * the one-time lowercase migration has run.
 */
const getAreas = async (): Promise<string[]> => {
  const groups = await prisma.customer.groupBy({
    by: ['area'],
    where: { isDeleted: false, area: { not: null } },
    orderBy: { area: 'asc' },
  });
  const seen = new Set<string>();
  const areas: string[] = [];
  for (const group of groups) {
    const area = normalizeArea(group.area ?? '');
    if (!area || seen.has(area)) continue;
    seen.add(area);
    areas.push(area);
  }
  return areas;
};

export const CustomerService = {
  create,
  getAll,
  getAreas,
  getById,
  updateById,
  softDelete,
};
