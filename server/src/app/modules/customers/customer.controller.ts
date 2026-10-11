import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { CustomerService } from './customer.service.js';

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await CustomerService.create(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: 'Customer created successfully',
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const result = await CustomerService.getAll(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Customers fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getAreas = catchAsync(async (_req: Request, res: Response) => {
  const result = await CustomerService.getAreas();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Customer areas fetched successfully',
    data: result,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await CustomerService.getById(req.params['id'] as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Customer fetched successfully',
    data: result,
  });
});

const updateById = catchAsync(async (req: Request, res: Response) => {
  const result = await CustomerService.updateById(req.params['id'] as string, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Customer updated successfully',
    data: result,
  });
});

const softDelete = catchAsync(async (req: Request, res: Response) => {
  const result = await CustomerService.softDelete(req.params['id'] as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Customer deleted successfully',
    data: result,
  });
});

export const CustomerController = {
  create,
  getAll,
  getAreas,
  getById,
  updateById,
  softDelete,
};
