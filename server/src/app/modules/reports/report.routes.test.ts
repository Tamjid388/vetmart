import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import { app } from '../../../app.js';

const REPORT_PATHS = [
  '/api/v1/reports/overview',
  '/api/v1/reports/sales',
  '/api/v1/reports/purchases',
  '/api/v1/reports/profit/summary',
  '/api/v1/reports/profit/by-product',
  '/api/v1/reports/customer-dues',
  '/api/v1/reports/vendor-dues',
  '/api/v1/reports/stock',
  '/api/v1/reports/expiry',
];

describe('Report routes (admin only, read-only)', () => {
  for (const path of REPORT_PATHS) {
    it(`GET ${path} without auth returns 401`, async () => {
      const res = await request(app).get(path);
      expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });
  }
});
