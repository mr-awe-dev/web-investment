import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { http, tokenStore } from './api';
import type { AuthResponse, User } from '../types/domain';

interface AuthState { user: User | null; loading: boolean; login: (email: string, password: string) => Promise<void>; register: (email: string, password: string, fullName: string) => Promise<void>; logout: () => void; setUser: (u: User) => void }

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!tokenStore.get());
  const qc = useQueryClient();

  useEffect(() => {
    if (!tokenStore.get()) return;
    http.get<User>('/auth/me').then(setUser).catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, []);

  const accept = useCallback((res: AuthResponse) => { tokenStore.set(res.token); setUser(res.user); qc.clear(); }, [qc]);
  const login = useCallback(async (email: string, password: string) => accept(await http.post<AuthResponse>('/auth/login', { email, password })), [accept]);
  const register = useCallback(async (email: string, password: string, fullName: string) => accept(await http.post<AuthResponse>('/auth/register', { email, password, fullName })), [accept]);
  const logout = useCallback(() => { tokenStore.clear(); setUser(null); qc.clear(); }, [qc]);

  const value = useMemo(() => ({ user, loading, login, register, logout, setUser }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
