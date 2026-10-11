import type { User } from '@prisma/client';
import type { TUserRole } from './user.constant.js';

export type TSafeUser = Omit<User, 'password'>;

export interface IRegisterPayload {
  email: string;
  password: string;
  name?: string;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IUpdateUserPayload {
  name?: string;
  password?: string;
  role?: TUserRole;
}

export interface ICreateUserPayload {
  email: string;
  password: string;
  name?: string;
  role?: TUserRole;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}
