import axios from 'axios';
import { AUTH_API } from '@/lib/constants/api.constants';
import { AUTH_STORAGE_KEYS } from '@/utils/cookieConstants';
import { isProtectedPath, ROUTES } from '@/utils/routesConstants';
import { ApiError } from '@/lib/api/apiError';

/**
 * Maps an axios error into the value we reject with:
 * - backend sent a non-empty `message`  -> ApiError (shown to the user)
 * - no backend message (or network err) -> raw payload / original error, so
 *   call sites fall back to their own UI message.
 */
function toRejection(response: { status?: number; data?: unknown } | undefined, original: unknown): unknown {
  const data = response?.data;
  const backendMessage =
    data && typeof data === 'object' && 'message' in data && typeof (data as { message?: unknown }).message === 'string'
      ? (data as { message: string }).message.trim()
      : '';

  if (backendMessage) {
    return new ApiError(backendMessage, response?.status, data);
  }
  return data || original;
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function clearAuthStorageOnClient() {
  if (typeof window === 'undefined') return;
  const wasLoggedIn = localStorage.getItem(AUTH_STORAGE_KEYS.IS_LOGGED_IN) === 'true';
  localStorage.removeItem(AUTH_STORAGE_KEYS.AUTH_USER);
  localStorage.removeItem(AUTH_STORAGE_KEYS.AUTH_EXPIRES_AT);
  localStorage.removeItem(AUTH_STORAGE_KEYS.IS_LOGGED_IN);

  if (wasLoggedIn) {
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { source: 'axios' } }));
  }
}

api.interceptors.response.use(
  (response) => response.data,
  (error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: { status?: number; data?: unknown };
      };
      if (axiosError.response?.status === 401) {
        if (typeof window !== 'undefined') {
          const pathname = window.location.pathname;
          // Don't redirect or clear if already on login/signup to avoid loops
          const isAuthPage = pathname.startsWith(ROUTES.LOGIN) || pathname.startsWith(ROUTES.SIGNUP);

          if (!isAuthPage) {
            clearAuthStorageOnClient();
            if (isProtectedPath(pathname)) {
              fetch(`/api${AUTH_API.LOGOUT}`, { method: 'POST', credentials: 'include' }).catch(() => {});
              window.location.href = `${ROUTES.LOGIN}?returnUrl=${encodeURIComponent(pathname)}`;
            }
          }
        }
      }
      return Promise.reject(toRejection(axiosError.response, error));
    }
    return Promise.reject(error);
  },
);

export const apiUpload = axios.create({
  baseURL: '/api',
  withCredentials: true,
  // No default Content-Type for uploads to allow automatic boundary setting
});

// Copy interceptors
apiUpload.interceptors.response.use(
  (response) => response.data,
  (error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as {
        response?: { status?: number; data?: unknown };
      };
      if (axiosError.response?.status === 401) {
        if (typeof window !== 'undefined') {
          const pathname = window.location.pathname;
          const isAuthPage = pathname.startsWith(ROUTES.LOGIN) || pathname.startsWith(ROUTES.SIGNUP);

          if (!isAuthPage) {
            clearAuthStorageOnClient();
            if (isProtectedPath(pathname)) {
              fetch(`/api${AUTH_API.LOGOUT}`, { method: 'POST', credentials: 'include' }).catch(() => {});
              window.location.href = `${ROUTES.LOGIN}?returnUrl=${encodeURIComponent(pathname)}`;
            }
          }
        }
      }
      return Promise.reject(toRejection(axiosError.response, error));
    }
    return Promise.reject(error);
  },
);

export default api;
