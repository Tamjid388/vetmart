import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { SupplierService } from './supplier.service.js';

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await SupplierService.create(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: 'Supplier created successfully',
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const result = await SupplierService.getAll(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Suppliers fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getDropdown = catchAsync(async (req: Request, res: Response) => {
  const result = await SupplierService.getDropdown({
    searchTerm: typeof req.query['searchTerm'] === 'string' ? req.query['searchTerm'] : undefined,
    limit: typeof req.query['limit'] === 'string' ? req.query['limit'] : undefined,
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Supplier dropdown fetched successfully',
    data: result,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await SupplierService.getById(req.params['id'] as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Supplier fetched successfully',
    data: result,
  });
});

const updateById = catchAsync(async (req: Request, res: Response) => {
  const result = await SupplierService.updateById(req.params['id'] as string, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Supplier updated successfully',
    data: result,
  });
});

const softDelete = catchAsync(async (req: Request, res: Response) => {
  const result = await SupplierService.softDelete(req.params['id'] as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Supplier deleted successfully',
    data: result,
  });
});

export const SupplierController = {
  create,
  getAll,
  getDropdown,
  getById,
  updateById,
  softDelete,
};
