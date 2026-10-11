import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import { app } from '../../../app.js';

describe('Audit routes (read-only, admin only)', () => {
  it('GET /api/v1/audits/overview without auth returns 401', async () => {
    const res = await request(app).get('/api/v1/audits/overview');
    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
  });

  it('GET /api/v1/audits/events without auth returns 401', async () => {
    const res = await request(app).get('/api/v1/audits/events');
    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
  });

  it('GET /api/v1/audits/events/:module/:id without auth returns 401', async () => {
    const res = await request(app).get('/api/v1/audits/events/sale/some-id');
    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
  });
});
