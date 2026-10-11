import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { PaymentService } from './payment.service.js';

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.create(req.body, req.user!.userId);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: 'Payment recorded successfully',
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getAll(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Payments fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await PaymentService.getById(req.params['id'] as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Payment fetched successfully',
    data: result,
  });
});

export const PaymentController = {
  create,
  getAll,
  getById,
};
