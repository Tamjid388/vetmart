import type { IMeta } from './sendResponse.js';

export interface IQueryParams {
  searchTerm?: string;
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  fields?: string;
  [key: string]: unknown;
}

// Prisma delegates (prisma.user, prisma.product, ...) are passed in wrapped
// so each service controls the exact findMany/count arg types via cast.
export interface IPrismaDelegate<T> {
  findMany: (args: Record<string, unknown>) => Promise<T[]>;
  count: (args: Record<string, unknown>) => Promise<number>;
}

const EXCLUDED_FIELDS = ['searchTerm', 'page', 'limit', 'sortBy', 'sortOrder', 'fields'];

export class QueryBuilder<T> {
  private readonly delegate: IPrismaDelegate<T>;
  private readonly query: IQueryParams;
  private readonly args: Record<string, unknown> = {};
  private page = 1;
  private limit = 10;

  constructor(delegate: IPrismaDelegate<T>, query: IQueryParams) {
    this.delegate = delegate;
    this.query = query;
  }

  search(searchableFields: string[]): this {
    const searchTerm = this.query.searchTerm;
    if (searchTerm && searchableFields.length > 0) {
      this.args['where'] = {
        ...((this.args['where'] as Record<string, unknown> | undefined) ?? {}),
        OR: searchableFields.map((field) => ({
          [field]: { contains: searchTerm, mode: 'insensitive' },
        })),
      };
    }
    return this;
  }

  filter(): this {
    const queryObj = { ...this.query };
    for (const field of EXCLUDED_FIELDS) {
      delete queryObj[field];
    }
    this.args['where'] = {
      ...((this.args['where'] as Record<string, unknown> | undefined) ?? {}),
      ...queryObj,
    };
    return this;
  }

  sort(defaultSortBy = 'createdAt'): this {
    const sortBy = this.query.sortBy ?? defaultSortBy;
    const sortOrder = this.query.sortOrder ?? 'desc';
    this.args['orderBy'] = { [sortBy]: sortOrder };
    return this;
  }

  paginate(): this {
    const page = Math.max(1, Number(this.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(this.query.limit) || 10));
    this.page = page;
    this.limit = limit;
    this.args['skip'] = (page - 1) * limit;
    this.args['take'] = limit;
    return this;
  }

  fields(): this {
    const fields = this.query.fields;
    if (fields) {
      const select: Record<string, boolean> = {};
      for (const field of fields.split(',')) {
        const trimmed = field.trim();
        if (trimmed) select[trimmed] = true;
      }
      if (Object.keys(select).length > 0) {
        this.args['select'] = select;
      }
    }
    return this;
  }

  async execute(): Promise<{ meta: IMeta; data: T[] }> {
    const where = (this.args['where'] as Record<string, unknown> | undefined) ?? {};
    const [data, total] = await Promise.all([this.delegate.findMany(this.args), this.delegate.count({ where })]);
    const totalPage = Math.ceil(total / this.limit);
    return {
      meta: { page: this.page, limit: this.limit, total, totalPage },
      data,
    };
  }
}
