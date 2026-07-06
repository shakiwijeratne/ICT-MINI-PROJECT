import { createContext } from 'react';
import type { UserProfile, UserRole } from '../types';

export interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  demoLogin: (role: UserRole) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
