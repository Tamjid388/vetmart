import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import { app } from './app.js';

describe('VetMart API foundation', () => {
  it('GET /health returns 200 with success envelope', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(StatusCodes.OK);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('healthy');
  });

  it('unknown routes return the 404 envelope', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');
    expect(res.status).toBe(StatusCodes.NOT_FOUND);
    expect(res.body.success).toBe(false);
  });

  it('invalid register payload returns validation error envelope', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({ email: 'not-an-email' });
    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation error');
  });
});
