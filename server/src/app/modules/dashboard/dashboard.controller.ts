import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { DashboardService } from './dashboard.service.js';

/** Live dashboard summary (KPIs, charts, due progress, alerts). Role-filtered. */
const getSummary = catchAsync(async (req: Request, res: Response) => {
  const result = await DashboardService.getSummary(req.user!.role);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Dashboard summary fetched successfully',
    data: result,
  });
});

export const DashboardController = {
  getSummary,
};
