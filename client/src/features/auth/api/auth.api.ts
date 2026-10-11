import { apiGet, apiPost } from '../../../lib/axios/axios.ts';
import type { AuthUser, LoginPayload, RegisterPayload } from '../types/auth.types.ts';

const BASE = '/auth';

/** POST /auth/login — session is held in HttpOnly cookies, nothing to store. */
export async function login(payload: LoginPayload): Promise<{ user: AuthUser }> {
  return apiPost<{ user: AuthUser }>(`${BASE}/login`, payload);
}

/**
 * @deprecated Dev-backup only. Staff onboarding uses POST /users (admin).
 * Never called from the UI.
 */
export async function register(payload: RegisterPayload): Promise<{ user: AuthUser }> {
  return apiPost<{ user: AuthUser }>(`${BASE}/register`, payload);
}

/** POST /auth/refresh-token — reads the refresh cookie, takes no body. */
export async function refreshSession(): Promise<{ user: AuthUser }> {
  return apiPost<{ user: AuthUser }>(`${BASE}/refresh-token`);
}

/** POST /auth/logout — clears auth cookies server-side. */
export async function logout(): Promise<unknown> {
  return apiPost<unknown>(`${BASE}/logout`);
}

/** GET /auth/me — the single source of truth for the signed-in user. */
export async function fetchMe(): Promise<AuthUser> {
  return apiGet<AuthUser>(`${BASE}/me`);
}
