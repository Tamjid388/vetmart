import axios, {
  AxiosError,
  type AxiosRequestConfig,
} from 'axios';


export const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1'
).trim().replace(/\/+$/, '');

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

type RetryableRequestConfig = AxiosRequestConfig & { _retry?: boolean };

function isAuthRoute(url: string | undefined): boolean {
  return !!url && url.includes('/auth/');
}

function shouldRedirectToLogin(): boolean {
  return (
    typeof window !== 'undefined' &&
    !window.location.pathname.startsWith('/auth')
  );
}

// Single shared refresh promise so concurrent 401s trigger only one refresh.
let refreshPromise: Promise<unknown> | null = null;

function silentRefresh(): Promise<unknown> {
  refreshPromise ??= api.post('/auth/refresh-token').finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string }>) => {
    const original = error.config as RetryableRequestConfig | undefined;

    // One silent refresh retry for expired access cookies. Never retries
    // /auth/* itself (login/refresh/logout) to avoid loops.
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isAuthRoute(original.url)
    ) {
      original._retry = true;
      try {
        await silentRefresh();
        return await api(original);
      } catch {
        if (shouldRedirectToLogin()) {
          window.location.assign('/auth/login');
        }
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401 && shouldRedirectToLogin()) {
      window.location.assign('/auth/login');
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback = 'Request failed'): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return (
      error.response?.data?.message ?? error.message ?? fallback
    );
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/** Shape sent by the VetMart API (see server `sendResponse`). */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  };
  data: T;
}

function isWrapped<T>(payload: unknown): payload is ApiResponse<T> {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'data' in payload &&
    'success' in payload
  );
}

function unwrap<T>(payload: ApiResponse<T> | T): T {
  return isWrapped<T>(payload) ? payload.data : payload;
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get<ApiResponse<T> | T>(url, config);
  return unwrap<T>(res.data);
}

export async function apiGetWithMeta<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<{ data: T; meta: ApiResponse<T>['meta'] }> {
  const res = await api.get<ApiResponse<T>>(url, config);
  return { data: res.data.data, meta: res.data.meta };
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.post<ApiResponse<T> | T>(url, body, config);
  return unwrap<T>(res.data);
}

export async function apiPut<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.put<ApiResponse<T> | T>(url, body, config);
  return unwrap<T>(res.data);
}

export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.patch<ApiResponse<T> | T>(url, body, config);
  return unwrap<T>(res.data);
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.delete<ApiResponse<T> | T>(url, config);
  return unwrap<T>(res.data);
}

/** Alias for `apiDelete`. */
export const apiDel = apiDelete;

export async function apiRequest<T>(config: AxiosRequestConfig & { url: string }): Promise<T> {
  const res = await api.request<ApiResponse<T> | T>(config);
  return unwrap<T>(res.data);
}

export default api;
