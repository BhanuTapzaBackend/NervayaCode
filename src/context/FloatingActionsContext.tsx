'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

interface FloatingActionsContextValue {
  isExpanded: boolean;
  hasButtons: boolean;
  expand: () => void;
  registerButton: () => () => void;
}

const FloatingActionsContext = createContext<FloatingActionsContextValue | null>(null);

const INITIAL_VISIBLE_MS = 4000;
const REOPEN_VISIBLE_MS = 4000;

interface FloatingActionsProviderProps {
  children: ReactNode;
}

export function FloatingActionsProvider({ children }: Readonly<FloatingActionsProviderProps>) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [buttonCount, setButtonCount] = useState(0);
  const buttonCountRef = useRef(0);
  const userExpandedRef = useRef(false);

  const expand = useCallback((): void => {
    userExpandedRef.current = true;
    setIsExpanded(true);
  }, []);

  const registerButton = useCallback((): (() => void) => {
    const wasZero = buttonCountRef.current === 0;
    buttonCountRef.current += 1;
    setButtonCount(buttonCountRef.current);
    if (wasZero) {
      setIsExpanded(true);
    }
    return () => {
      buttonCountRef.current = Math.max(0, buttonCountRef.current - 1);
      setButtonCount(buttonCountRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isExpanded || buttonCount === 0) return;
    const delay = userExpandedRef.current ? REOPEN_VISIBLE_MS : INITIAL_VISIBLE_MS;
    const timer = window.setTimeout(() => {
      setIsExpanded(false);
      userExpandedRef.current = false;
    }, delay);
    return () => window.clearTimeout(timer);
  }, [isExpanded, buttonCount]);

  return (
    <FloatingActionsContext.Provider value={{ isExpanded, hasButtons: buttonCount > 0, expand, registerButton }}>
      {children}
    </FloatingActionsContext.Provider>
  );
}

export function useFloatingActions(): FloatingActionsContextValue {
  const ctx = useContext(FloatingActionsContext);
  if (!ctx) {
    throw new Error('useFloatingActions must be used within FloatingActionsProvider');
  }
  return ctx;
}
