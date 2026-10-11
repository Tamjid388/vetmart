import { Prisma } from '@prisma/client';
import type { Prisma as PrismaTypes } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/AppError.js';
import { QueryBuilder } from '../../shared/QueryBuilder.js';
import type { IQueryParams } from '../../shared/QueryBuilder.js';
import { SaleSearchableFields } from './sale.constant.js';
import { allocateFifo, computeSaleTotals, round2, startOfToday } from './sale.logic.js';
import { toSaleResponse } from './sale.interface.js';
import type {
  ICreateSalePayload,
  IShortStockLine,
  TPopulatedSale,
  TSaleResponse,
  TSaleRole,
} from './sale.interface.js';

type Tx = PrismaTypes.TransactionClient;

const saleInclude = {
  customer: { select: { id: true, name: true, phone: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, unit: true } },
      batch: { select: { id: true, batchNumber: true, expiryDate: true } },
    },
    orderBy: { id: 'asc' as const },
  },
} satisfies PrismaTypes.SaleInclude;

/** Invoice counter id — single row in sale_counter (see 0005_pos_sale). */
const SALE_COUNTER_ID = 'sale';
const MAX_INVOICE_RETRIES = 3;

const findActiveSaleOrThrow = async (id: string): Promise<TPopulatedSale> => {
  const sale = (await prisma.sale.findFirst({
    where: { id, isDeleted: false },
    include: saleInclude,
  })) as unknown as TPopulatedSale | null;
  if (!sale) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Sale not found');
  }
  return sale;
};

const isP2002 = (err: unknown): err is Prisma.PrismaClientKnownRequestError =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';

const p2002Targets = (err: Prisma.PrismaClientKnownRequestError): string[] =>
  (err.meta as { target?: string[] } | undefined)?.target ?? [];

const nextInvoiceNo = async (tx: Tx): Promise<string> => {
  const rows = await tx.$queryRaw<{ lastNumber: number }[]>`
    UPDATE "sale_counter" SET "lastNumber" = "lastNumber" + 1
    WHERE "id" = ${SALE_COUNTER_ID} RETURNING "lastNumber"
  `;
  const lastNumber = rows[0]?.lastNumber;
  if (lastNumber === undefined) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Invoice counter unavailable');
  }
  return `SALE-${String(lastNumber).padStart(5, '0')}`;
};

const createInTransaction = async (
  tx: Tx,
  payload: ICreateSalePayload,
  soldBy: string,
  role: TSaleRole,
): Promise<{ sale: TSaleResponse; created: boolean }> => {
  // 1. Idempotency: retry with the same key returns the original sale.
  const existing = (await tx.sale.findUnique({
    where: { idempotencyKey: payload.idempotencyKey },
    include: saleInclude,
  })) as unknown as TPopulatedSale | null;
  if (existing) {
    return { sale: toSaleResponse(existing, role), created: false };
  }

  // 2. REGISTERED sales need a real customer (Rule 9). CASH sales are
  //    anonymous by design — no lookup, no due owner.
  const isCash = payload.saleType === 'CASH';
  const customerId = isCash ? null : (payload.customerId as string);
  if (!isCash) {
    const customer = await tx.customer.findFirst({
      where: { id: payload.customerId as string, isDeleted: false },
    });
    if (!customer) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Customer not found');
    }
  }

  // 3. Lock all touched product rows (ordered by id to avoid deadlocks)
  //    and re-check availability after locking (Rule 13).
  const productIds = [...new Set(payload.items.map((item) => item.productId))].sort();
  await tx.$queryRaw`
    SELECT "id" FROM "products" WHERE "id" IN (${Prisma.join(productIds)})
    ORDER BY "id" FOR UPDATE
  `;
  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
    include: { batches: { orderBy: { expiryDate: 'asc' as const } } },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  // Merge duplicate cart lines for the same product.
  const mergedQty = new Map<string, number>();
  for (const item of payload.items) {
    mergedQty.set(item.productId, (mergedQty.get(item.productId) ?? 0) + item.qty);
  }

  const today = startOfToday();
  const shortLines: IShortStockLine[] = [];
  const planned: {
    productId: string;
    sellingPrice: number;
    vatPercent: number;
    allocations: { batchId: string; qty: number; purchasePrice: number }[];
  }[] = [];

  for (const [productId, qty] of mergedQty) {
    const product = productById.get(productId);
    if (!product || product.isDeleted) {
      throw new AppError(StatusCodes.NOT_FOUND, `Product not found: ${productId}`);
    }
    if (!product.isActive) {
      throw new AppError(StatusCodes.BAD_REQUEST, `Product "${product.name}" is not active`);
    }
    const fifo = allocateFifo(
      product.batches.map((b) => ({
        batchId: b.id,
        stock: b.stock,
        expiryDate: b.expiryDate,
        purchasePrice: Number(b.purchasePrice),
      })),
      qty,
      today,
    );
    if (fifo.allocations.reduce((sum, a) => sum + a.qty, 0) < qty) {
      shortLines.push({
        productId,
        productName: product.name,
        requested: qty,
        available: fifo.available,
        expiredOnly: fifo.expiredOnly,
      });
      continue;
    }
    planned.push({
      productId,
      sellingPrice: Number(product.sellingPrice),
      vatPercent: Number(product.vatPercent),
      allocations: fifo.allocations,
    });
  }

  // Rule 16: whole sale blocked on short or expired-only stock — no partial fills.
  if (shortLines.length > 0) {
    const expiredOnly = shortLines.every((line) => line.expiredOnly);
    throw new AppError(
      StatusCodes.CONFLICT,
      expiredOnly ? 'Expired stock: sale blocked' : 'Insufficient stock: sale blocked',
      true,
      { lines: shortLines },
    );
  }

  // 4. Server-computed totals (Rule 11) + amount guards (Rule 15).
  const lines = planned.flatMap((p) =>
    p.allocations.map((a) => ({
      qty: a.qty,
      sellingPrice: p.sellingPrice,
      vatPercent: p.vatPercent,
    })),
  );
  const discount = round2(payload.discount ?? 0);
  const paidAmount = round2(payload.paidAmount);
  const preview = computeSaleTotals(lines, 0, 0);
  if (discount > round2(preview.subtotal + preview.vatTotal)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Discount exceeds bill total');
  }
  const totals = computeSaleTotals(lines, discount, paidAmount);
  if (paidAmount > totals.grandTotal) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Paid amount cannot exceed grand total');
  }
  if (paidAmount > 0 && (payload.paymentMethod === undefined || payload.paymentMethod === null) && !isCash) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Payment method is required when an amount is collected');
  }
  if (paidAmount === 0 && payload.paymentMethod !== undefined && payload.paymentMethod !== null) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Payment method must be empty for a fully due sale');
  }
  // Cash sale = full cash payment by definition (E4b). The client locks the
  // paid input, but the server re-enforces: no partial, no e-money, no due.
  // paidAmount > grandTotal is already rejected above; paidAmount < grandTotal
  // surfaces here as dueAmount > 0.
  if (isCash) {
    if (
      payload.paymentMethod !== undefined &&
      payload.paymentMethod !== null &&
      payload.paymentMethod !== 'CASH'
    ) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Cash sales accept only CASH payments');
    }
    if (totals.dueAmount !== 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'Cash sales must be paid in full');
    }
  }

  // 5. Serialized invoice number.
  const invoiceNo = await nextInvoiceNo(tx);

  // 6. Persist: sale + one item per product per lot (Rule 18), ledger rows,
  //    batch deductions, and customer due update — all in this transaction.
  const created = await tx.sale.create({
    data: {
      invoiceNo,
      idempotencyKey: payload.idempotencyKey,
      saleType: payload.saleType,
      customerId,
      subtotal: totals.subtotal,
      discount: totals.discount,
      vatTotal: totals.vatTotal,
      grandTotal: totals.grandTotal,
      paidAmount: totals.paidAmount,
      dueAmount: totals.dueAmount,
      ...(isCash ? { paymentMethod: 'CASH' as const } : payload.paymentMethod ? { paymentMethod: payload.paymentMethod } : {}),
      paymentStatus: totals.paymentStatus,
      soldBy,
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
      items: {
        create: planned.flatMap((p) =>
          p.allocations.map((a) => ({
            productId: p.productId,
            batchId: a.batchId,
            qty: a.qty,
            sellingPrice: p.sellingPrice,
            purchasePrice: a.purchasePrice,
            vatPercent: p.vatPercent,
            lineTotal: round2(a.qty * p.sellingPrice),
          })),
        ),
      },
    },
  });

  // Per-batch stock moves + audit rows. stockAfter is computed from the
  // locked read above, so concurrent sales cannot interleave (Rule 13).
  const consumedByBatch = new Map<string, { productId: string; qty: number; stockBefore: number }>();
  for (const p of planned) {
    const product = productById.get(p.productId);
    for (const a of p.allocations) {
      const batch = product?.batches.find((b) => b.id === a.batchId);
      const entry = consumedByBatch.get(a.batchId) ?? {
        productId: p.productId,
        qty: 0,
        stockBefore: batch?.stock ?? 0,
      };
      entry.qty += a.qty;
      consumedByBatch.set(a.batchId, entry);
    }
  }
  for (const [batchId, entry] of consumedByBatch) {
    await tx.productBatch.update({
      where: { id: batchId },
      data: { stock: { decrement: entry.qty } },
    });
    await tx.stockLedger.create({
      data: {
        productId: entry.productId,
        batchId,
        type: 'SALE',
        qtyDelta: -entry.qty,
        stockAfter: entry.stockBefore - entry.qty,
        refId: created.id,
        createdBy: soldBy,
      },
    });
  }

  // Cash sales always settle in full (guarded above), so this only ever
  // fires for REGISTERED dues. The customerId check is a backstop so a
  // future totals change can never strand a due on an anonymous sale.
  if (totals.dueAmount > 0 && customerId) {
    await tx.customer.update({
      where: { id: customerId },
      data: { dueBalance: { increment: totals.dueAmount } },
    });
  }

  const result = (await tx.sale.findUnique({
    where: { id: created.id },
    include: saleInclude,
  })) as unknown as TPopulatedSale | null;
  if (!result) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Sale was created but could not be loaded');
  }
  return { sale: toSaleResponse(result, role), created: true };
};

const create = async (
  payload: ICreateSalePayload,
  soldBy: string,
  role: TSaleRole,
): Promise<{ sale: TSaleResponse; created: boolean }> => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_INVOICE_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction((tx) => createInTransaction(tx, payload, soldBy, role));
    } catch (err) {
      // Idempotency race: another request won — return the original sale.
      if (isP2002(err) && p2002Targets(err).includes('idempotencyKey')) {
        const existing = (await prisma.sale.findUnique({
          where: { idempotencyKey: payload.idempotencyKey },
          include: saleInclude,
        })) as unknown as TPopulatedSale | null;
        if (existing) return { sale: toSaleResponse(existing, role), created: false };
      }
      // Invoice collision backstop (Rule 14): retry with the next number.
      if (isP2002(err) && p2002Targets(err).includes('invoiceNo') && attempt < MAX_INVOICE_RETRIES) {
        lastError = err;
        continue;
      }
      throw err;
    }
  }
  throw lastError;
};

const getAll = async (query: IQueryParams, role: TSaleRole) => {
  const qbQuery: IQueryParams = { isDeleted: false };
  if (typeof query['paymentStatus'] === 'string') qbQuery['paymentStatus'] = query['paymentStatus'];
  if (typeof query['saleType'] === 'string') qbQuery['saleType'] = query['saleType'];
  if (typeof query['customerId'] === 'string') qbQuery['customerId'] = query['customerId'];
  if (typeof query['soldBy'] === 'string') qbQuery['soldBy'] = query['soldBy'];
  if (typeof query.searchTerm === 'string') qbQuery.searchTerm = query.searchTerm;
  if (typeof query.page === 'string') qbQuery.page = query.page;
  if (typeof query.limit === 'string') qbQuery.limit = query.limit;
  if (typeof query.sortBy === 'string') qbQuery.sortBy = query.sortBy;
  if (query.sortOrder === 'asc' || query.sortOrder === 'desc') qbQuery.sortOrder = query.sortOrder;

  const builder = new QueryBuilder<TSaleResponse>(
    {
      findMany: async (args) => {
        const sales = (await prisma.sale.findMany({
          ...((args as Prisma.SaleFindManyArgs).where ? { where: (args as Prisma.SaleFindManyArgs).where } : {}),
          ...((args as Prisma.SaleFindManyArgs).orderBy
            ? { orderBy: (args as Prisma.SaleFindManyArgs).orderBy }
            : {}),
          ...((args as Prisma.SaleFindManyArgs).skip !== undefined
            ? { skip: (args as Prisma.SaleFindManyArgs).skip }
            : {}),
          ...((args as Prisma.SaleFindManyArgs).take !== undefined
            ? { take: (args as Prisma.SaleFindManyArgs).take }
            : {}),
          include: saleInclude,
        })) as unknown as TPopulatedSale[];
        return sales.map((sale) => toSaleResponse(sale, role));
      },
      count: (args) => prisma.sale.count(args as Prisma.SaleCountArgs),
    },
    qbQuery,
  );
  return builder.search(SaleSearchableFields).filter().sort('saleDate').paginate().execute();
};

const getById = async (id: string, role: TSaleRole): Promise<TSaleResponse> => {
  const sale = await findActiveSaleOrThrow(id);
  return toSaleResponse(sale, role);
};

/**
 * Full-sale void by admin (SRS Rule 19): one transaction marks the sale
 * deleted, restocks each lot, writes RETURN ledger rows, and reverses the
 * customer due. No partial void, no edit. Double void is 409.
 */
const voidSale = async (id: string, adminId: string): Promise<TSaleResponse> => {
  return prisma.$transaction(async (tx) => {
    const sale = (await tx.sale.findUnique({
      where: { id },
      include: {
        items: true,
      },
    })) as unknown as (TPopulatedSale & { items: TPopulatedSale['items'] }) | null;
    if (!sale) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Sale not found');
    }
    if (sale.isDeleted) {
      throw new AppError(StatusCodes.CONFLICT, 'Sale already voided');
    }

    // Atomic soft-delete — concurrent voids serialize here; loser sees 409.
    const marked = await tx.sale.updateMany({
      where: { id, isDeleted: false },
      data: { isDeleted: true },
    });
    if (marked.count === 0) {
      throw new AppError(StatusCodes.CONFLICT, 'Sale already voided');
    }

    const batchIds = [...new Set(sale.items.map((item) => item.batchId).filter(Boolean))].sort();
    const batchById = new Map<string, { stock: number; productId: string }>();
    if (batchIds.length > 0) {
      await tx.$queryRaw`
        SELECT "id" FROM "product_batches" WHERE "id" IN (${Prisma.join(batchIds as string[])})
        ORDER BY "id" FOR UPDATE
      `;
      const batches = await tx.productBatch.findMany({
        where: { id: { in: batchIds as string[] } },
      });
      for (const b of batches) {
        batchById.set(b.id, { stock: b.stock, productId: b.productId });
      }
    }

    const restockByBatch = new Map<string, { productId: string; qty: number }>();
    for (const item of sale.items) {
      if (!item.batchId) continue;
      const entry = restockByBatch.get(item.batchId) ?? {
        productId: item.productId,
        qty: 0,
      };
      entry.qty += item.qty;
      restockByBatch.set(item.batchId, entry);
    }

    for (const [batchId, entry] of restockByBatch) {
      const batch = batchById.get(batchId);
      const stockBefore = batch?.stock ?? 0;
      await tx.productBatch.update({
        where: { id: batchId },
        data: { stock: { increment: entry.qty } },
      });
      await tx.stockLedger.create({
        data: {
          productId: batch?.productId ?? entry.productId,
          batchId,
          type: 'RETURN',
          qtyDelta: entry.qty,
          stockAfter: stockBefore + entry.qty,
          refId: sale.id,
          createdBy: adminId,
        },
      });
    }

    // Cash sales carry no due (dueAmount is 0 by construction), and their
    // customerId is null — skip the reversal so voiding one never throws.
    const dueAmount = Number(sale.dueAmount);
    if (dueAmount > 0 && sale.customerId) {
      await tx.customer.update({
        where: { id: sale.customerId },
        data: { dueBalance: { decrement: dueAmount } },
      });
    }

    const result = (await tx.sale.findUnique({
      where: { id: sale.id },
      include: saleInclude,
    })) as unknown as TPopulatedSale | null;
    if (!result) {
      throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Sale was voided but could not be loaded');
    }
    return toSaleResponse(result, 'admin');
  });
};

export const SaleService = {
  create,
  getAll,
  getById,
  voidSale,
};
