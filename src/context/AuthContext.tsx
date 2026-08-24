'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { AUTH_API } from '@/lib/constants/api.constants';
import { ApiResponse } from '@/lib/utils/response.util';
import { getApiErrorMessage } from '@/lib/utils/apiError.util';
import { ROLES, Role } from '@/lib/constants/roles';
import { ROUTES } from '@/utils/routesConstants';
import { validateReturnUrl } from '@/utils/returnUrl';
import { AUTH_STORAGE_KEYS, COOKIE_OPTIONS } from '@/utils/cookieConstants';
import { trackLoggedIn, updateGaUserContext } from '@/utils/analytics';
import { cartApi } from '@/lib/api/cart';
import { getGuestCartItems, clearGuestCart } from '@/utils/guestCart';

interface User {
  _id: string;
  phone: string;
  name: string;
  role: Role;
  email?: string;
  /** Present when role is THERAPIST: the linked Therapist profile id. */
  therapistId?: string;
}

export interface AuthData {
  user: User;
  token: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  initializing: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (phone: string, returnUrl?: string) => Promise<ApiResponse<AuthData | LoginWithOtpData>>;
  signup: (phone: string, name: string, returnUrl?: string) => Promise<ApiResponse<AuthData | LoginWithOtpData>>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => void;
  completeLoginWithOtp: (data: AuthData, isFirstTime?: boolean, returnUrl?: string) => void;
}

export interface LoginWithOtpData {
  requireOtp: true;
  phone: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.AUTH_USER);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    const expiresAt = localStorage.getItem(AUTH_STORAGE_KEYS.AUTH_EXPIRES_AT);
    if (expiresAt) {
      const exp = Number(expiresAt);
      if (!Number.isFinite(exp) || Date.now() >= exp) {
        localStorage.removeItem(AUTH_STORAGE_KEYS.AUTH_USER);
        localStorage.removeItem(AUTH_STORAGE_KEYS.AUTH_EXPIRES_AT);
        localStorage.removeItem(AUTH_STORAGE_KEYS.IS_LOGGED_IN);
        return null;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

function clearAuthStorage() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEYS.AUTH_USER);
  localStorage.removeItem(AUTH_STORAGE_KEYS.AUTH_EXPIRES_AT);
  localStorage.removeItem(AUTH_STORAGE_KEYS.IS_LOGGED_IN);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const verifyAbortRef = useRef<AbortController | null>(null);

  const hydrateFromStore = () => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      setIsAuthenticated(true);
      updateGaUserContext({
        logged_in: true,
        internal_user_id: stored._id,
        user_type: 'registered',
        lifecycle_stage: 'customer',
      });
    } else {
      setUser(null);
      setIsAuthenticated(false);
      updateGaUserContext({
        logged_in: false,
        internal_user_id: null,
        user_type: 'guest',
        lifecycle_stage: 'anonymous',
      });
    }
  };

  const verifySessionWithServer = async () => {
    verifyAbortRef.current?.abort();
    const ctrl = new AbortController();
    verifyAbortRef.current = ctrl;
    try {
      const response = (await api.get(AUTH_API.ME, { signal: ctrl.signal })) as ApiResponse<{ user: User }>;
      if (ctrl.signal.aborted) return;
      if (response.success && response.data?.user) {
        const fresh = response.data.user;
        setUser(fresh);
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          const expiresAt = Date.now() + COOKIE_OPTIONS.AUTH_TOKEN_MAX_AGE * 1000;
          localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_USER, JSON.stringify(fresh));
          localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_EXPIRES_AT, String(expiresAt));
          localStorage.setItem(AUTH_STORAGE_KEYS.IS_LOGGED_IN, 'true');
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        clearAuthStorage();
      }
    } catch {
      if (ctrl.signal.aborted) return;
      setUser(null);
      setIsAuthenticated(false);
      clearAuthStorage();
    }
  };

  const mergeGuestCart = async () => {
    const guestItems = getGuestCartItems();
    if (guestItems.length === 0) return;
    try {
      await Promise.all(
        guestItems.map((item) =>
          cartApi.add(item.itemId, item.quantity, item.itemType, item.name, item.price, item.image, item.metadata),
        ),
      );
      clearGuestCart();
    } catch {
      // Best-effort merge — leave the guest cart intact so nothing is silently lost if it fails.
    }
  };

  const handleAuthSuccess = async (data: AuthData, isFirstTime: boolean = false, returnUrl?: string) => {
    verifyAbortRef.current?.abort();
    setUser(data.user);
    setIsAuthenticated(true);

    if (data.user.role === ROLES.CUSTOMER) {
      await mergeGuestCart();
    }

    if (typeof window !== 'undefined') {
      const expiresAt = Date.now() + COOKIE_OPTIONS.AUTH_TOKEN_MAX_AGE * 1000;
      localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_USER, JSON.stringify(data.user));
      localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_EXPIRES_AT, String(expiresAt));
      localStorage.setItem(AUTH_STORAGE_KEYS.IS_LOGGED_IN, 'true');
      window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { source: 'AuthContext' } }));
    }

    updateGaUserContext({
      logged_in: true,
      internal_user_id: data.user._id,
      user_type: 'registered',
      lifecycle_stage: 'customer',
    });

    trackLoggedIn({
      signup_method: 'WhatsApp',
      page_type: window.location.pathname,
      firsttime: isFirstTime ? 1 : 0,
    });

    const safeReturnUrl = validateReturnUrl(returnUrl);
    if (data.user.role === ROLES.ADMIN) {
      router.push(ROUTES.ADMIN_DASHBOARD);
    } else if (data.user.role === ROLES.THERAPIST) {
      router.push(ROUTES.THERAPIST_DASHBOARD);
    } else if (safeReturnUrl) {
      router.push(safeReturnUrl);
    } else {
      router.push(ROUTES.DASHBOARD);
    }
  };

  useEffect(() => {
    hydrateFromStore();
    setInitializing(false);
    void verifySessionWithServer();

    const handleAuthEvent = (e: Event) => {
      // Avoid re-hydrating if the event was dispatched by this context itself
      if ((e as CustomEvent).detail?.source === 'AuthContext') return;
      hydrateFromStore();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('auth-state-changed', handleAuthEvent);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('auth-state-changed', handleAuthEvent);
      }
    };
  }, []);

  const signup = async (phone: string, name: string, returnUrl?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = (await api.post(AUTH_API.SIGNUP, {
        phone,
        name,
      })) as ApiResponse<AuthData | LoginWithOtpData>;

      if (response.success && response.data && !('requireOtp' in response.data && response.data.requireOtp)) {
        handleAuthSuccess(response.data as AuthData, true, returnUrl);
      }
      return response;
    } catch (err) {
      const message = getApiErrorMessage(err, 'Signup failed');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone: string, returnUrl?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = (await api.post(AUTH_API.LOGIN, {
        phone,
      })) as ApiResponse<AuthData | LoginWithOtpData>;

      if (response.success && response.data) {
        const data = response.data as AuthData | LoginWithOtpData;
        if ('requireOtp' in data && data.requireOtp) {
          return response;
        }
        handleAuthSuccess(data as AuthData, false, returnUrl);
      }
      return response;
    } catch (err) {
      const message = getApiErrorMessage(err, 'Login failed');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const completeLoginWithOtp = (data: AuthData, isFirstTime: boolean = false, returnUrl?: string) => {
    handleAuthSuccess(data, isFirstTime, returnUrl);
  };

  const logout = async () => {
    verifyAbortRef.current?.abort();
    setLoading(true);
    try {
      await api.post(AUTH_API.LOGOUT);
    } catch {
    } finally {
      setLoading(false);
    }

    setUser(null);
    setIsAuthenticated(false);
    clearAuthStorage();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { source: 'AuthContext' } }));
    }
    updateGaUserContext({
      logged_in: false,
      internal_user_id: null,
      user_type: 'guest',
      lifecycle_stage: 'anonymous',
    });
    router.push(ROUTES.LOGIN);
  };

  const clearError = () => setError(null);

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    const next = { ...user, ...updates };
    setUser(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEYS.AUTH_USER, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('auth-state-changed'));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initializing,
        error,
        isAuthenticated,
        login,
        signup,
        logout,
        clearError,
        updateUser,
        completeLoginWithOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
