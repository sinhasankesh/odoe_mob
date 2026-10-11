import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, getToken, unwrap } from '@/api/client';
import { registerStudent as registerStudentRequest, restoreGoogleSession, signIn, signInWithGoogle as googleRequest } from '@/api/auth';
import { Session } from '@/types';
import { signInWithGoogle as googleTokenRequest } from '@/api/auth';

type AuthValue = { session: Session | null; loading: boolean; login: (email: string, password: string) => Promise<Session>; registerStudent: (input: { full_name: string; email: string; mobile: string; password: string; class_id: string }) => Promise<void>; loginWithGoogle: (idToken: string) => Promise<Session>; loginWithGoogleToken: (token: string) => Promise<Session>; refreshProfile: () => Promise<void>; logout: () => Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: React.PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    getToken().then(async (token) => {
      if (token) {
        try {
          const profile = unwrap<any>(await api<any>('/auth/profile', {}, token));
          if (active) setSession({ token, user: profile.user || profile });
        } catch { /* Invalid or expired tokens are cleared by the API client. */ }
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const value = useMemo<AuthValue>(() => ({
    session, loading,
    login: async (email, password) => { const next = await signIn(email, password); setSession(next); return next; },
    registerStudent: async (input) => { const next = await registerStudentRequest(input); setSession(next); },
    loginWithGoogle: async (idToken) => { const next = await googleRequest(idToken); setSession(next); return next; },
    loginWithGoogleToken: async (token) => { const next = await restoreGoogleSession(token); setSession(next); return next; },
    refreshProfile: async () => { const profile=unwrap<any>(await api('/auth/profile')); setSession(current=>current?{...current,user:profile.user||profile}:null); },
    logout: async () => { await clearToken(); setSession(null); },
  }), [session, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth must be used inside AuthProvider'); return value; }
