'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppProvider } from "@/contexts/AppContext";
import { PlanProvider } from "@/contexts/PlanContext";
import { PlanActionsProvider } from "@/contexts/PlanActionsContext";

export function ClientProviders({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  return (
    <AppProvider>
      <PlanProvider>
        <PlanActionsProvider>
          <div key={user?.id || 'no-user'}>
            {children}
          </div>
        </PlanActionsProvider>
      </PlanProvider>
    </AppProvider>
  );
} 