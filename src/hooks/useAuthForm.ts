'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { AUTH_FORM_MODE, type AuthFormMode } from '@/lib/constants/enums';
import { normalizePhone, validateName } from '@/lib/utils/validation.util';

export interface AuthFormErrors {
  phone?: string;
  name?: string;
}

export interface UseAuthFormOptions {
  initialMode?: AuthFormMode;
  returnUrl?: string;
}

export function useAuthForm(options: UseAuthFormOptions = {}) {
  const { initialMode = AUTH_FORM_MODE.LOGIN, returnUrl } = options;
  const { login, signup, loading, error, clearError } = useAuthContext();

  const [isRightPanelActive, setIsRightPanelActive] = useState(initialMode === AUTH_FORM_MODE.SIGNUP);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFormErrors>({});

  // Restore state from sessionStorage on mount
  useEffect(() => {
    const savedIsRightPanel = sessionStorage.getItem('nervaya_auth_isRightPanelActive');
    if (savedIsRightPanel !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsRightPanelActive(savedIsRightPanel === 'true');
    }

    const savedPhone = sessionStorage.getItem('nervaya_auth_phone');
    if (savedPhone) {
      setPhone(savedPhone);
    }

    const savedName = sessionStorage.getItem('nervaya_auth_name');
    if (savedName) {
      setName(savedName);
    }
  }, []);

  // Sync state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('nervaya_auth_isRightPanelActive', String(isRightPanelActive));
    sessionStorage.setItem('nervaya_auth_phone', phone);
    sessionStorage.setItem('nervaya_auth_name', name);
  }, [isRightPanelActive, phone, name]);

  const handleSignupClick = useCallback(() => {
    clearError();
    setFieldErrors({});
    setIsRightPanelActive(true);
  }, [clearError]);

  const handleLoginClick = useCallback(() => {
    clearError();
    setFieldErrors({});
    setIsRightPanelActive(false);
  }, [clearError]);

  const validateLoginForm = useCallback((): boolean => {
    const errors: AuthFormErrors = {};
    const trimmedPhone = phone.trim();

    if (!trimmedPhone) {
      errors.phone = 'WhatsApp number is required';
    } else if (!normalizePhone(trimmedPhone)) {
      errors.phone = 'Enter a valid 10-digit mobile number';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [phone]);

  const validateSignupForm = useCallback((): boolean => {
    const errors: AuthFormErrors = {};
    const trimmedPhone = phone.trim();
    const trimmedName = name.trim();

    if (!trimmedName) {
      errors.name = 'Name is required';
    } else if (!validateName(trimmedName)) {
      errors.name = 'Name must be at least 2 characters long';
    }

    if (!trimmedPhone) {
      errors.phone = 'WhatsApp number is required';
    } else if (!normalizePhone(trimmedPhone)) {
      errors.phone = 'Enter a valid 10-digit mobile number';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [phone, name]);

  const handleLoginSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateLoginForm()) return;
      clearError();
      const normalizedPhone = normalizePhone(phone) ?? phone.trim();
      const response = await login(normalizedPhone, returnUrl);
      return response;
    },
    [phone, returnUrl, validateLoginForm, login, clearError],
  );

  const handleSignupSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateSignupForm()) return;
      clearError();
      const normalizedPhone = normalizePhone(phone) ?? phone.trim();
      return signup(normalizedPhone, name.trim(), returnUrl);
    },
    [phone, name, returnUrl, validateSignupForm, signup, clearError],
  );

  const clearFieldError = useCallback((field: keyof AuthFormErrors) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleInputChange = useCallback(
    (field: 'phone' | 'name', value: string) => {
      if (error) clearError();
      clearFieldError(field);
      if (field === 'phone') setPhone(value);
      else setName(value);
    },
    [error, clearError, clearFieldError],
  );

  return {
    isRightPanelActive,
    phone,
    name,
    fieldErrors,
    loading,
    error,
    handleSignupClick,
    handleLoginClick,
    handleLoginSubmit,
    handleSignupSubmit,
    handleInputChange,
  };
}
