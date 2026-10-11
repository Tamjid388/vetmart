import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/AppError.js';
import { QueryBuilder } from '../../shared/QueryBuilder.js';
import type { IQueryParams } from '../../shared/QueryBuilder.js';
import { PaymentSearchableFields } from './payment.constant.js';
import { toPaymentResponse } from './payment.interface.js';
import type { ICreatePaymentPayload, TPaymentResponse, TPopulatedPayment } from './payment.interface.js';

const paymentInclude = {
  customer: { select: { id: true, name: true, phone: true } },
  sale: { select: { id: true, invoiceNo: true, grandTotal: true, dueAmount: true } },
  supplier: { select: { id: true, companyName: true, phone: true } },
  purchase: { select: { id: true, invoiceNo: true, grandTotal: true, dueAmount: true } },
  collectedByUser: { select: { id: true, name: true, email: true } },
} satisfies Prisma.PaymentInclude;

const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

const findActivePaymentOrThrow = async (id: string): Promise<TPopulatedPayment> => {
  const payment = (await prisma.payment.findFirst({
    where: { id, isDeleted: false },
    include: paymentInclude,
  })) as unknown as TPopulatedPayment | null;
  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Payment not found');
  }
  return payment;
};

/**
 * Due collection (SRS GAP-2) + vendor payable collection (SRS 4.14): one
 * atomic transaction creates the payment and decrements the matching
 * balance. Exactly one side per row (customer XOR supplier); over-payment
 * on either side is blocked with 400.
 */
const create = async (payload: ICreatePaymentPayload, collectedBy: string): Promise<TPaymentResponse> => {
  const amount = round2(payload.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'amount must be greater than 0');
  }
  const hasCustomer = payload.customerId !== undefined;
  const hasSupplier = payload.supplierId !== undefined;
  if (hasCustomer === hasSupplier) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Exactly one of customerId or supplierId is required');
  }

  return prisma.$transaction(async (tx) => {
    let paidAt: Date | undefined;
    if (payload.paidAt !== undefined) {
      paidAt = new Date(payload.paidAt);
      if (Number.isNaN(paidAt.getTime())) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid paidAt');
      }
    }

    if (hasSupplier) {
      const supplier = await tx.supplier.findFirst({
        where: { id: payload.supplierId as string, isDeleted: false },
      });
      if (!supplier) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Supplier not found');
      }

      if (payload.purchaseId !== undefined && payload.purchaseId !== null) {
        const purchase = await tx.purchase.findFirst({
          where: { id: payload.purchaseId, isDeleted: false },
        });
        if (!purchase) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Purchase not found');
        }
        if (purchase.supplierId !== (payload.supplierId as string)) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Linked purchase belongs to a different supplier');
        }
      }
      if (payload.saleId !== undefined && payload.saleId !== null) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'saleId cannot be linked to a supplier payment');
      }

      const payableBalance = Number(supplier.payableBalance);
      if (amount > round2(payableBalance)) {
        throw new AppError(
          StatusCodes.BAD_REQUEST,
          `Payment of ${amount} exceeds outstanding payable of ${round2(payableBalance)}`,
        );
      }

      const created = (await tx.payment.create({
        data: {
          ...(payload.purchaseId ? { purchaseId: payload.purchaseId } : {}),
          supplierId: payload.supplierId as string,
          amount,
          method: payload.method,
          collectedBy,
          ...(paidAt ? { paidAt } : {}),
        },
        include: paymentInclude,
      })) as unknown as TPopulatedPayment;

      await tx.supplier.update({
        where: { id: payload.supplierId as string },
        data: { payableBalance: { decrement: amount } },
      });

      return toPaymentResponse(created);
    }

    const customer = await tx.customer.findFirst({
      where: { id: payload.customerId as string, isDeleted: false },
    });
    if (!customer) {
      throw new AppError(StatusCodes.NOT_FOUND, 'Customer not found');
    }

    if (payload.saleId !== undefined && payload.saleId !== null) {
      const sale = await tx.sale.findFirst({
        where: { id: payload.saleId, isDeleted: false },
      });
      if (!sale) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Sale not found');
      }
      // Cash sales settle in full at the counter and carry no due — there is
      // nothing to collect against them.
      if (sale.saleType === 'CASH') {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Cash sales carry no due and cannot be linked to a payment');
      }
      if (sale.customerId !== (payload.customerId as string)) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Linked sale belongs to a different customer');
      }
    }
    if (payload.purchaseId !== undefined && payload.purchaseId !== null) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'purchaseId cannot be linked to a customer payment');
    }

    const dueBalance = Number(customer.dueBalance);
    if (amount > round2(dueBalance)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        `Collection of ${amount} exceeds outstanding due of ${round2(dueBalance)}`,
      );
    }

    const created = (await tx.payment.create({
      data: {
        ...(payload.saleId ? { saleId: payload.saleId } : {}),
        customerId: payload.customerId as string,
        amount,
        method: payload.method,
        collectedBy,
        ...(paidAt ? { paidAt } : {}),
      },
      include: paymentInclude,
    })) as unknown as TPopulatedPayment;

    await tx.customer.update({
      where: { id: payload.customerId as string },
      data: { dueBalance: { decrement: amount } },
    });

    return toPaymentResponse(created);
  });
};

const getAll = async (query: IQueryParams) => {
  const qbQuery: IQueryParams = { isDeleted: false };
  if (typeof query['customerId'] === 'string') qbQuery['customerId'] = query['customerId'];
  if (typeof query['saleId'] === 'string') qbQuery['saleId'] = query['saleId'];
  if (typeof query['supplierId'] === 'string') qbQuery['supplierId'] = query['supplierId'];
  if (typeof query['purchaseId'] === 'string') qbQuery['purchaseId'] = query['purchaseId'];
  if (typeof query['method'] === 'string') qbQuery['method'] = query['method'];
  if (typeof query['collectedBy'] === 'string') qbQuery['collectedBy'] = query['collectedBy'];
  if (typeof query.searchTerm === 'string') qbQuery.searchTerm = query.searchTerm;
  if (typeof query.page === 'string') qbQuery.page = query.page;
  if (typeof query.limit === 'string') qbQuery.limit = query.limit;
  if (typeof query.sortBy === 'string') qbQuery.sortBy = query.sortBy;
  if (query.sortOrder === 'asc' || query.sortOrder === 'desc') qbQuery.sortOrder = query.sortOrder;

  const builder = new QueryBuilder<TPaymentResponse>(
    {
      findMany: async (args) => {
        const payments = (await prisma.payment.findMany({
          ...((args as Prisma.PaymentFindManyArgs).where ? { where: (args as Prisma.PaymentFindManyArgs).where } : {}),
          ...((args as Prisma.PaymentFindManyArgs).orderBy
            ? { orderBy: (args as Prisma.PaymentFindManyArgs).orderBy }
            : {}),
          ...((args as Prisma.PaymentFindManyArgs).skip !== undefined
            ? { skip: (args as Prisma.PaymentFindManyArgs).skip }
            : {}),
          ...((args as Prisma.PaymentFindManyArgs).take !== undefined
            ? { take: (args as Prisma.PaymentFindManyArgs).take }
            : {}),
          include: paymentInclude,
        })) as unknown as TPopulatedPayment[];
        return payments.map(toPaymentResponse);
      },
      count: (args) => prisma.payment.count(args as Prisma.PaymentCountArgs),
    },
    qbQuery,
  );
  return builder.search(PaymentSearchableFields).filter().sort('paidAt').paginate().execute();
};

const getById = async (id: string): Promise<TPaymentResponse> => {
  const payment = await findActivePaymentOrThrow(id);
  return toPaymentResponse(payment);
};

export const PaymentService = {
  create,
  getAll,
  getById,
};
