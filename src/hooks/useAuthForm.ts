'use client';

import { useState, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { AUTH_FORM_MODE, type AuthFormMode } from '@/lib/constants/enums';
import { validateEmail, validatePassword, validateName } from '@/lib/utils/validation.util';

export interface AuthFormErrors {
  email?: string;
  password?: string;
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<AuthFormErrors>({});

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
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      errors.email = 'Email is required';
    } else if (!validateEmail(trimmedEmail)) {
      errors.email = 'Invalid email format';
    }

    if (!trimmedPassword) {
      errors.password = 'Password is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [email, password]);

  const validateSignupForm = useCallback((): boolean => {
    const errors: AuthFormErrors = {};
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    if (!trimmedName) {
      errors.name = 'Name is required';
    } else if (!validateName(trimmedName)) {
      errors.name = 'Name must be at least 2 characters long';
    }

    if (!trimmedEmail) {
      errors.email = 'Email is required';
    } else if (!validateEmail(trimmedEmail)) {
      errors.email = 'Invalid email format';
    }

    if (!trimmedPassword) {
      errors.password = 'Password is required';
    } else {
      const pwValidation = validatePassword(trimmedPassword);
      if (!pwValidation.valid) {
        errors.password = pwValidation.message;
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [email, password, name]);

  const handleLoginSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateLoginForm()) return;
      clearError();
      const response = await login(email.trim().toLowerCase(), password.trim(), returnUrl);
      return response;
    },
    [email, password, returnUrl, validateLoginForm, login, clearError],
  );

  const handleSignupSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validateSignupForm()) return;
      clearError();
      return signup(email.trim().toLowerCase(), password.trim(), name.trim(), returnUrl);
    },
    [email, password, name, returnUrl, validateSignupForm, signup, clearError],
  );

  const clearFieldError = useCallback((field: keyof AuthFormErrors) => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const handleInputChange = useCallback(
    (field: 'email' | 'password' | 'name', value: string) => {
      if (error) clearError();
      clearFieldError(field);
      if (field === 'email') setEmail(value);
      else if (field === 'password') setPassword(value);
      else setName(value);
    },
    [error, clearError, clearFieldError],
  );

  return {
    isRightPanelActive,
    email,
    password,
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
