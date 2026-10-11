import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import config from '../config/index.js';

export interface IJwtPayload {
  userId: string;
  role: string;
}

const sign = (payload: IJwtPayload, secret: string, expiresIn: string): string => {
  return jwt.sign(payload, secret as Secret, { expiresIn } as SignOptions);
};

export const jwtHelpers = {
  signAccessToken: (payload: IJwtPayload): string =>
    sign(payload, config.JWT_ACCESS_SECRET, config.JWT_ACCESS_EXPIRES_IN),
  signRefreshToken: (payload: IJwtPayload): string =>
    sign(payload, config.JWT_REFRESH_SECRET, config.JWT_REFRESH_EXPIRES_IN),
  verifyAccessToken: (token: string): IJwtPayload =>
    jwt.verify(token, config.JWT_ACCESS_SECRET as Secret) as IJwtPayload,
  verifyRefreshToken: (token: string): IJwtPayload =>
    jwt.verify(token, config.JWT_REFRESH_SECRET as Secret) as IJwtPayload,
};
