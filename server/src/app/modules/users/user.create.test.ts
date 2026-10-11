import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import { app } from '../../../app.js';
import { jwtHelpers } from '../../utils/jwtHelpers.js';
import { UserValidation } from './user.validation.js';

const adminToken = jwtHelpers.signAccessToken({ userId: 'admin-self-id', role: 'admin' });
const staffToken = jwtHelpers.signAccessToken({ userId: 'staff-id', role: 'staff' });

describe('E7 admin user management (DB-free guard tests)', () => {
  it('POST /users without a token returns 401', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .send({ email: 'new@vetmart.com', password: 'Staff123!' });
    expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    expect(res.body.success).toBe(false);
  });

  it('POST /users as staff returns 403', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Cookie', [`accessToken=${staffToken}`])
      .send({ email: 'new@vetmart.com', password: 'Staff123!' });
    expect(res.status).toBe(StatusCodes.FORBIDDEN);
  });

  it('POST /users as admin with an invalid body returns 400 (validation, no DB hit)', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Cookie', [`accessToken=${adminToken}`])
      .send({ email: 'not-an-email', password: 'x' });
    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.message).toBe('Validation error');
  });

  it('admin cannot deactivate their own account (400 before any DB call)', async () => {
    const res = await request(app)
      .delete('/api/v1/users/admin-self-id')
      .set('Cookie', [`accessToken=${adminToken}`]);
    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.message).toContain('own account');
  });

  it('admin cannot change their own role (400 before any DB call)', async () => {
    const res = await request(app)
      .patch('/api/v1/users/admin-self-id')
      .set('Cookie', [`accessToken=${adminToken}`])
      .send({ role: 'staff' });
    expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    expect(res.body.message).toContain('own role');
  });

  it('createUser schema defaults role to staff', async () => {
    const parsed = await UserValidation.createUser.parseAsync({
      body: { email: 'new@vetmart.com', password: 'Staff123!' },
    });
    expect(parsed.body.role).toBe('staff');
  });

  it('createUser schema accepts an explicit admin role', async () => {
    const parsed = await UserValidation.createUser.parseAsync({
      body: { email: 'boss@vetmart.com', password: 'Admin123!', role: 'admin' },
    });
    expect(parsed.body.role).toBe('admin');
  });
});
