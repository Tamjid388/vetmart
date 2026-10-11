import { StatusCodes } from 'http-status-codes';
import type { NextFunction, Request, Response } from 'express';
import type { TUserRole } from '../modules/users/user.constant.js';
import { AppError } from '../shared/AppError.js';
import { jwtHelpers } from '../utils/jwtHelpers.js';

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: TUserRole };
    }
  }
}

// Cookie-first auth with one-release Bearer fallback.
// Usage: router.get('/', auth('admin', 'staff'), ...)
export const auth = (...requiredRoles: TUserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const cookieToken = req.cookies?.['accessToken'] as string | undefined;
    const header = req.headers.authorization;
    let token: string | undefined = cookieToken;
    if (!token && header?.startsWith('Bearer ')) {
      token = header.split(' ')[1];
      // Transitional fallback — remove after clients migrate fully to cookies.
      console.warn('[auth] Authorization Bearer fallback used; migrate client to HttpOnly cookies');
    }
    if (!token) {
      return next(
        new AppError(StatusCodes.UNAUTHORIZED, 'Missing or invalid credentials. Please sign in again.'),
      );
    }
    let decoded: { userId: string; role: TUserRole };
    try {
      decoded = jwtHelpers.verifyAccessToken(token) as {
        userId: string;
        role: TUserRole;
      };
    } catch {
      return next(new AppError(StatusCodes.UNAUTHORIZED, 'Invalid or expired access token'));
    }
    req.user = decoded;
    if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
      return next(new AppError(StatusCodes.FORBIDDEN, 'Forbidden: insufficient role'));
    }
    next();
  };
};
