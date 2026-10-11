import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Express 5 handles async rejections natively; this wrapper keeps
// explicit next(err) forwarding + a single typing convention.
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
