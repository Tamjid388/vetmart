import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { PurchaseService } from './purchase.service.js';

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseService.create(req.body, req.user!.userId);
  sendResponse(res, {
    // Idempotent retry returns the original purchase with 200 (Rule 21).
    statusCode: result.created ? StatusCodes.CREATED : StatusCodes.OK,
    message: result.created ? 'Purchase recorded successfully' : 'Purchase already recorded',
    data: result.purchase,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseService.getAll(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Purchases fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseService.getById(req.params['id'] as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Purchase fetched successfully',
    data: result,
  });
});

const voidPurchase = catchAsync(async (req: Request, res: Response) => {
  const result = await PurchaseService.voidPurchase(req.params['id'] as string, req.user!.userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Purchase voided successfully',
    data: result,
  });
});

export const PurchaseController = {
  create,
  getAll,
  getById,
  voidPurchase,
};
