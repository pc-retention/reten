import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { fetchSettingsListRpc } from './serverQueries';
import { supabase } from './supabase';

export const ADMIN_EMAIL_SETTING_KEY = 'auth_admin_email';
export const ADMIN_USERNAME_SETTING_KEY = 'auth_admin_username';
export const DEFAULT_ADMIN_EMAIL = 'admin@reten.app';

type AuthContextValue = {
  adminEmail: string;
  loading: boolean;
  session: Session | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getConfiguredAdminEmail(value: string | null | undefined) {
  const normalizedValue = value?.trim().toLowerCase();
  return normalizedValue || DEFAULT_ADMIN_EMAIL;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [adminEmail, setAdminEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  async function signOut() {
    await supabase.auth.signOut();
  }

  useEffect(() => {
    let isActive = true;

    async function loadAuthState() {
      const [{ data: authData }, settingsRes] = await Promise.all([
        supabase.auth.getSession(),
        fetchSettingsListRpc(),
      ]);

      if (!isActive) {
        return;
      }

      const adminEmailSetting = settingsRes.data.find((item) => item.key === ADMIN_EMAIL_SETTING_KEY);
      setAdminEmail(getConfiguredAdminEmail(adminEmailSetting?.value));
      setSession(authData.session);
      setLoading(false);
    }

    void loadAuthState();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isActive = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        adminEmail,
        loading,
        session,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
