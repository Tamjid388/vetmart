import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import { app } from '../../../app.js';

describe('Dashboard routes (role-filtered, read-only)', () => {
  it('GET /api/v1/dashboard without auth returns 401', async () => {
    const res = await request(app).get('/api/v1/dashboard');
    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
  });
});
