'use client';

import { Member } from '@/models/Member';
import { createContext, useContext, useState, ReactNode } from 'react';

type AppDataContextType = {
  members: any[] | null;
  setMembers: (data: any[]) => void;

};

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
const [members, setMembers] = useState<Member[] | null>(null);
  
  return (
    <AppDataContext.Provider
      value={{
        members,
        setMembers,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
