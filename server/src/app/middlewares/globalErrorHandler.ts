import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
import { AppError } from '../shared/AppError.js';
import config from '../config/index.js';

interface IErrorSource {
  path: string;
  message: string;
}

export const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong';
  let errorSources: IErrorSource[] = [{ path: '', message: 'Something went wrong' }];
  let details: unknown;

  if (err instanceof ZodError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Validation error';
    errorSources = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = StatusCodes.CONFLICT;
      const target = (err.meta as { target?: string[] } | undefined)?.target;
      message = `Duplicate value${target ? ` for ${target.join(', ')}` : ''}`;
      errorSources = [{ path: target?.join(', ') ?? '', message }];
    } else if (err.code === 'P2025') {
      statusCode = StatusCodes.NOT_FOUND;
      message = 'Record not found';
      errorSources = [{ path: '', message }];
    } else {
      statusCode = StatusCodes.BAD_REQUEST;
      message = 'Database request failed';
      errorSources = [{ path: '', message: (err.meta as { cause?: string } | undefined)?.cause ?? message }];
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Invalid database query';
    errorSources = [{ path: '', message }];
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [{ path: '', message: err.message }];
    details = err.details;
  } else if (err instanceof SyntaxError && 'body' in (err as unknown as Record<string, unknown>)) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = 'Malformed JSON in request body';
    errorSources = [{ path: '', message }];
  } else if (err instanceof Error) {
    message = err.message || message;
    errorSources = [{ path: '', message }];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    ...(details !== undefined ? { details } : {}),
    ...(!config.isProduction && err instanceof Error && err.stack ? { stack: err.stack } : {}),
  });
};
