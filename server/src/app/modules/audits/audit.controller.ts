import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { AuditService } from './audit.service.js';

/** Unified activity timeline across sales, purchases, payments, stock, users, masters. */
const getEvents = catchAsync(async (req: Request, res: Response) => {
  const result = await AuditService.getEvents(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Audit events fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

/** Aggregate counts/sums for the audit overview cards. */
const getOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await AuditService.getOverview(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Audit overview fetched successfully',
    data: result,
  });
});

/** Single underlying record (with relations) behind an audit event. */
const getEventDetail = catchAsync(async (req: Request, res: Response) => {
  const result = await AuditService.getEventDetail(req.params['module'] as string, req.params['id'] as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Audit event detail fetched successfully',
    data: result,
  });
});

export const AuditController = {
  getEvents,
  getOverview,
  getEventDetail,
};
