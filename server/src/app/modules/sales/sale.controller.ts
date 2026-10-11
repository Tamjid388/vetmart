import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { SaleService } from './sale.service.js';

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await SaleService.create(req.body, req.user!.userId, req.user!.role);
  sendResponse(res, {
    // Idempotent retry returns the original sale with 200 (Rule 12).
    statusCode: result.created ? StatusCodes.CREATED : StatusCodes.OK,
    message: result.created ? 'Sale completed successfully' : 'Sale already completed',
    data: result.sale,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const result = await SaleService.getAll(req.query, req.user!.role);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Sales fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await SaleService.getById(req.params['id'] as string, req.user!.role);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Sale fetched successfully',
    data: result,
  });
});

const voidSale = catchAsync(async (req: Request, res: Response) => {
  const result = await SaleService.voidSale(req.params['id'] as string, req.user!.userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Sale voided successfully',
    data: result,
  });
});

export const SaleController = {
  create,
  getAll,
  getById,
  voidSale,
};
