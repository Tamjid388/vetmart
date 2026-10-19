import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { ReportService } from './report.service.js';

/** Report overview cards (sales, purchases, profit, dues, stock, expiry). */
const getOverview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportService.getOverview(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Report overview fetched successfully',
    data: result,
  });
});

/** Paginated sales report with period, status, and invoice/customer search. */
const getSales = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportService.getSales(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Sales report fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

/** Paginated purchase report with period, status, and invoice/supplier search. */
const getPurchases = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportService.getPurchases(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Purchase report fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

/** Profit summary (FIFO-actual COGS from sale-item cost snapshots). */
const getProfitSummary = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportService.getProfitSummary(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Profit summary fetched successfully',
    data: result,
  });
});

/** Profit ranked by product for the selected period. */
const getProfitByProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportService.getProfitByProduct(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Profit by product fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

/** Customer dues with area + search filters, highest due first. */
const getCustomerDues = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportService.getCustomerDues(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Customer due report fetched successfully',
    meta: result.meta,
    data: { summary: result.summary, rows: result.data },
  });
});

/** Vendor payables with search filter, highest payable first. */
const getVendorDues = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportService.getVendorDues(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Vendor due report fetched successfully',
    meta: result.meta,
    data: { summary: result.summary, rows: result.data },
  });
});

/** Stock report with computed stock, lot-cost value, and status. */
const getStock = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportService.getStock(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Stock report fetched successfully',
    meta: result.meta,
    data: { summary: result.summary, rows: result.data },
  });
});

/** Expiry report over lots with stock on hand (expired + near-expiry). */
const getExpiry = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportService.getExpiry(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Expiry report fetched successfully',
    meta: result.meta,
    data: { summary: result.summary, rows: result.data },
  });
});

export const ReportController = {
  getOverview,
  getSales,
  getPurchases,
  getProfitSummary,
  getProfitByProduct,
  getCustomerDues,
  getVendorDues,
  getStock,
  getExpiry,
};
