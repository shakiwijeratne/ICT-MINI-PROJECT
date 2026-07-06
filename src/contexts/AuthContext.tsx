import { useEffect, useState, type ReactNode } from 'react';
import {
  getCurrentSessionUser,
  subscribeToAuth,
  logoutUser,
  loginDemoUser,
} from '../services/authService';
import { getUserProfile } from '../services/authService';
import { localStore } from '../services/localStore';
import { isFirebaseConfigured } from '../services/firebase';
import { AuthContext } from './AuthContextCore';
import type { UserProfile, UserRole } from '../types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const profile = await getCurrentSessionUser();
    setUser(profile);
  };

  useEffect(() => {
    localStore.seedDemoData();

    if (isFirebaseConfigured) {
      const unsub = subscribeToAuth(async (firebaseUser) => {
        if (firebaseUser) {
          const profile = await getUserProfile(firebaseUser.uid);
          setUser(profile);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return unsub;
    }

    getCurrentSessionUser().then((profile) => {
      setUser(profile);
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const demoLogin = (role: UserRole) => {
    const profile = loginDemoUser(role);
    setUser(profile);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
}
