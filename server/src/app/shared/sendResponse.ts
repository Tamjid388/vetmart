import type { Response } from 'express';

export interface IMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

interface IApiResponse<T> {
  statusCode: number;
  message: string;
  meta?: IMeta;
  data?: T;
}

export const sendResponse = <T>(res: Response, payload: IApiResponse<T>): void => {
  res.status(payload.statusCode).json({
    success: true,
    statusCode: payload.statusCode,
    message: payload.message,
    ...(payload.meta ? { meta: payload.meta } : {}),
    ...(payload.data !== undefined ? { data: payload.data } : {}),
  });
};
