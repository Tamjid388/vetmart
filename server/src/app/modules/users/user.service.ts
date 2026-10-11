import type { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../shared/prisma.js';
import { AppError } from '../../shared/AppError.js';
import { QueryBuilder } from '../../shared/QueryBuilder.js';
import type { IQueryParams } from '../../shared/QueryBuilder.js';
import { jwtHelpers } from '../../utils/jwtHelpers.js';
import { comparePassword, hashPassword } from '../../utils/password.js';
import { UserSearchableFields } from './user.constant.js';
import type { IAuthTokens, ICreateUserPayload, ILoginPayload, IRegisterPayload, IUpdateUserPayload, TSafeUser } from './user.interface.js';

const excludePassword = <T extends { password?: unknown }>(user: T): Omit<T, 'password'> => {
  const rest = { ...user };
  delete rest.password;
  return rest;
};

const findActiveUserOrThrow = async (id: string) => {
  const user = await prisma.user.findFirst({ where: { id, isDeleted: false } });
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }
  return user;
};

/**
 * @deprecated Dev-backup only. Use `createUser` (POST /users, admin) for staff onboarding.
 * Never called from the UI.
 */
const register = async (payload: IRegisterPayload): Promise<{ user: TSafeUser; tokens: IAuthTokens }> => {
  const hashedPassword = await hashPassword(payload.password);
  const user = await prisma.user.create({
    data: {
      email: payload.email,
      password: hashedPassword,
      ...(payload.name ? { name: payload.name } : {}),
      role: 'staff',
    },
  });
  const tokens = {
    accessToken: jwtHelpers.signAccessToken({ userId: user.id, role: user.role }),
    refreshToken: jwtHelpers.signRefreshToken({ userId: user.id, role: user.role }),
  };
  return { user: excludePassword(user), tokens };
};

const login = async (payload: ILoginPayload): Promise<{ user: TSafeUser; tokens: IAuthTokens }> => {
  const user = await prisma.user.findFirst({
    where: { email: payload.email, isDeleted: false },
  });
  if (!user || !(await comparePassword(payload.password, user.password))) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }
  const tokens = {
    accessToken: jwtHelpers.signAccessToken({ userId: user.id, role: user.role }),
    refreshToken: jwtHelpers.signRefreshToken({ userId: user.id, role: user.role }),
  };
  return { user: excludePassword(user), tokens };
};

const refreshAccessToken = async (
  refreshToken: string,
): Promise<{ user: TSafeUser; tokens: IAuthTokens }> => {
  let decoded: { userId: string; role: string };
  try {
    decoded = jwtHelpers.verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Invalid or expired refresh token');
  }
  const user = await prisma.user.findFirst({
    where: { id: decoded.userId, isDeleted: false },
  });
  if (!user) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'User no longer exists');
  }
  // Rotate: issue a fresh pair on every refresh.
  const tokens = {
    accessToken: jwtHelpers.signAccessToken({ userId: user.id, role: user.role }),
    refreshToken: jwtHelpers.signRefreshToken({ userId: user.id, role: user.role }),
  };
  return { user: excludePassword(user), tokens };
};

const getMe = async (userId: string): Promise<TSafeUser> => {
  const user = await findActiveUserOrThrow(userId);
  return excludePassword(user);
};

const getAll = async (query: IQueryParams) => {
  // Never expose password hashes, even via ?fields=...
  if (query.fields) {
    const fields = query.fields
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f && f !== 'password');
    query = { ...query, fields: fields.join(',') || 'id' };
  }
  const builder = new QueryBuilder<TSafeUser>(
    {
      findMany: (args) => prisma.user.findMany(args as Prisma.UserFindManyArgs) as Promise<TSafeUser[]>,
      count: (args) => prisma.user.count(args as Prisma.UserCountArgs),
    },
    { ...query, isDeleted: false },
  );
  const result = await builder.search(UserSearchableFields).filter().sort().paginate().fields().execute();
  return {
    meta: result.meta,
    data: result.data.map((user) => excludePassword(user as TSafeUser & { password?: unknown })),
  };
};

const getById = async (id: string): Promise<TSafeUser> => {
  const user = await findActiveUserOrThrow(id);
  return excludePassword(user);
};

/**
 * Admin-created account (E7). Same hashing/create shape as `register` but the
 * role is selectable (staff default) and no JWT pair is issued — the admin's
 * own session must survive staff creation, so no cookies are set downstream.
 */
const createUser = async (payload: ICreateUserPayload): Promise<TSafeUser> => {
  const existing = await prisma.user.findFirst({
    where: { email: payload.email, isDeleted: false },
  });
  if (existing) {
    throw new AppError(StatusCodes.CONFLICT, 'Email already in use');
  }
  const hashedPassword = await hashPassword(payload.password);
  const user = await prisma.user.create({
    data: {
      email: payload.email,
      password: hashedPassword,
      ...(payload.name ? { name: payload.name } : {}),
      role: payload.role ?? 'staff',
    },
  });
  return excludePassword(user);
};

const updateById = async (id: string, payload: IUpdateUserPayload): Promise<TSafeUser> => {
  await findActiveUserOrThrow(id);
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(payload.role !== undefined ? { role: payload.role } : {}),
      ...(payload.password !== undefined ? { password: await hashPassword(payload.password) } : {}),
    },
  });
  return excludePassword(user);
};

const softDelete = async (id: string): Promise<TSafeUser> => {
  await findActiveUserOrThrow(id);
  const user = await prisma.user.update({
    where: { id },
    data: { isDeleted: true },
  });
  return excludePassword(user);
};

export const UserService = {
  register,
  createUser,
  login,
  refreshAccessToken,
  getMe,
  getAll,
  getById,
  updateById,
  softDelete,
};
