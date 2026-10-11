import { apiDelete, apiGetWithMeta, apiPatch, apiPost } from '../../../lib/axios/axios.ts';
import type {
  CreateUserPayload,
  ManagedUser,
  UpdateUserPayload,
  UserListMeta,
  UserListQueryParams,
} from '../types/user.types.ts';

const BASE = '/users';

export async function getUsers(
  params?: UserListQueryParams,
): Promise<{ data: ManagedUser[]; meta: UserListMeta | undefined }> {
  const query: Record<string, string> = {};
  if (params?.searchTerm) query.searchTerm = params.searchTerm;
  if (params?.page) query.page = String(params.page);
  if (params?.limit) query.limit = String(params.limit);
  if (params?.sortBy) query.sortBy = params.sortBy;
  if (params?.sortOrder) query.sortOrder = params.sortOrder;

  const res = await apiGetWithMeta<ManagedUser[]>(BASE, { params: query });
  return res;
}

export async function createUser(payload: CreateUserPayload): Promise<ManagedUser> {
  const res = await apiPost<{ user: ManagedUser }>(BASE, payload);
  return res.user;
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<ManagedUser> {
  return apiPatch<ManagedUser>(`${BASE}/${id}`, payload);
}

export async function deleteUser(id: string): Promise<ManagedUser> {
  return apiDelete<ManagedUser>(`${BASE}/${id}`);
}
