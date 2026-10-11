import type { AuthUser, UserRole } from '../../auth/index.ts';

export type ManagedUser = AuthUser;

export type CreateUserPayload = {
  email: string;
  password: string;
  name?: string;
  role: UserRole;
};

export type UpdateUserPayload = {
  name?: string;
  password?: string;
  role?: UserRole;
};

export type UserFormValues = {
  email: string;
  password: string;
  name?: string;
  role: UserRole;
};

export type UserListQueryParams = {
  searchTerm?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type UserListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};
