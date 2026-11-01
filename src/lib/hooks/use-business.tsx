'use client';

import React, { createContext, useContext, type ReactNode } from 'react';
import type { Business } from '@/lib/types';

interface BusinessContextValue {
  business: Business;
  user: {
    id: string;
    email: string;
  };
}

const BusinessContext = createContext<BusinessContextValue | null>(null);

interface BusinessProviderProps {
  business: Business;
  user: { id: string; email: string };
  children: ReactNode;
}

export function BusinessProvider({ business, user, children }: BusinessProviderProps) {
  return (
    <BusinessContext.Provider value={{ business, user }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness(): BusinessContextValue {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}

export { BusinessContext };
