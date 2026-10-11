import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const notFound = (req: Request, res: Response): void => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Not found: ${req.originalUrl}`,
    errorSources: [{ path: req.originalUrl, message: 'API endpoint does not exist' }],
  });
};
