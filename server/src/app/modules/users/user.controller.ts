import type { CookieOptions, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import config from '../../config/index.js';
import { AppError } from '../../shared/AppError.js';
import { catchAsync } from '../../shared/catchAsync.js';
import { sendResponse } from '../../shared/sendResponse.js';
import { UserService } from './user.service.js';

/** Parse '1h' / '7d' / '15m' / '30s' style durations to milliseconds for cookie maxAge. */
const durationToMs = (value: string, fallbackMs: number): number => {
  const match = /^(\d+)\s*([smhd])$/i.exec(value.trim());
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase();
  const factor =
    unit === 's' ? 1000 : unit === 'm' ? 60 * 1000 : unit === 'h' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return amount * factor;
};

const accessTokenMaxAge = durationToMs(config.JWT_ACCESS_EXPIRES_IN, 60 * 60 * 1000);
const refreshTokenMaxAge = durationToMs(config.JWT_REFRESH_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000);

const baseCookieOptions: CookieOptions = config.isProduction
  ? {
      // Prod: frontend (Netlify) and backend (Vercel) are cross-site,
      // so Lax cookies get dropped on fetch POST. None + Secure is required.
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    }
  : {
      // Local dev is same-site (localhost), Lax works without Secure/https.
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    };

const setAuthCookies = (res: Response, tokens: { accessToken: string; refreshToken: string }): void => {
  res.cookie('accessToken', tokens.accessToken, { ...baseCookieOptions, maxAge: accessTokenMaxAge });
  res.cookie('refreshToken', tokens.refreshToken, { ...baseCookieOptions, maxAge: refreshTokenMaxAge });
};

const clearAuthCookies = (res: Response): void => {
  // Must match the flags used in setAuthCookies, otherwise logout won't clear cross-site cookies.
  res.clearCookie('accessToken', { ...baseCookieOptions, maxAge: undefined });
  res.clearCookie('refreshToken', { ...baseCookieOptions, maxAge: undefined });
};

/**
 * @deprecated Dev-backup only. Use `createUser` (POST /users, admin) for staff onboarding.
 * Never called from the UI.
 */
const register = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.register(req.body);
  setAuthCookies(res, result.tokens);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: 'User registered successfully',
    data: { user: result.user },
  });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.login(req.body);
  setAuthCookies(res, result.tokens);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Login successful',
    data: { user: result.user },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const incoming = req.cookies?.['refreshToken'] as string | undefined;
  if (!incoming) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'Missing refresh token');
  }
  const result = await UserService.refreshAccessToken(incoming);
  setAuthCookies(res, result.tokens);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Access token refreshed',
    data: { user: result.user },
  });
});

const logout = catchAsync(async (_req: Request, res: Response) => {
  clearAuthCookies(res);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Logged out successfully',
    data: {},
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getMe(req.user!.userId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Profile fetched successfully',
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAll(req.query);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Users fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getById(req.params['id'] as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'User fetched successfully',
    data: result,
  });
});

const updateById = catchAsync(async (req: Request, res: Response) => {
  const targetId = req.params['id'] as string;
  // Self-demote guard: an admin must never change their own role (lockout risk).
  if (req.user?.userId === targetId && req.body?.role !== undefined && req.body.role !== req.user.role) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You cannot change your own role');
  }
  const result = await UserService.updateById(targetId, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'User updated successfully',
    data: result,
  });
});

const softDelete = catchAsync(async (req: Request, res: Response) => {
  const targetId = req.params['id'] as string;
  // Self-delete guard: an admin must never deactivate their own account.
  if (req.user?.userId === targetId) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You cannot deactivate your own account');
  }
  const result = await UserService.softDelete(targetId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'User deleted successfully',
    data: result,
  });
});

/**
 * Admin-created account (E7). Deliberately sets no auth cookies — unlike
 * `register`, the calling admin stays signed in as themselves.
 */
const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createUser(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: 'User created successfully',
    data: { user: result },
  });
});

export const UserController = {
  register,
  createUser,
  login,
  refreshToken,
  logout,
  getMe,
  getAll,
  getById,
  updateById,
  softDelete,
};
