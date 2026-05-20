'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  isDesktop: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const storageKey = user?._id ? `sidebar-collapsed-${user._id}` : 'sidebar-collapsed';

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem('sidebar-collapsed');
        return stored === 'true';
      } catch {}
    }
    return false;
  });
  const [isDesktop, setIsDesktop] = useState(false);

  // Sync state when storageKey (i.e. user) changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored !== null) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIsCollapsed(stored === 'true');
        } else {
          setIsCollapsed(false);
        }
      } catch {}
    }
  }, [storageKey]);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth > 770;
      setIsDesktop(desktop);
      if (!desktop) {
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(storageKey, String(isCollapsed));
      } catch {}
    }
  }, [isCollapsed, storageKey]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        toggleCollapsed,
        isDesktop,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
