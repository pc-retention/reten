import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchSettingsListRpc } from './serverQueries';

export const DASHBOARD_PASSWORD_SETTING_KEY = 'dashboard_password_hash';
export const LEGACY_AUTH_SETTING_KEYS = ['auth_admin_email', 'auth_admin_username'] as const;

const SESSION_STORAGE_KEY = 'reten-dashboard-session';

type SignInResult = 'success' | 'invalid_password' | 'password_not_configured';

type AuthContextValue = {
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  refreshPasswordHash: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredSession() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(value: string) {
  const encodedValue = new TextEncoder().encode(value);
  const digestBuffer = await crypto.subtle.digest('SHA-256', encodedValue);
  return bytesToHex(new Uint8Array(digestBuffer));
}

export async function createDashboardPasswordHash(password: string) {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);

  const salt = bytesToHex(saltBytes);
  const digest = await sha256Hex(`${salt}:${password}`);

  return `sha256$${salt}$${digest}`;
}

async function verifyDashboardPassword(password: string, storedHash: string | null) {
  if (!storedHash) {
    return false;
  }

  const [algorithm, salt, expectedDigest] = storedHash.split('$');

  if (algorithm !== 'sha256' || !salt || !expectedDigest) {
    return false;
  }

  const actualDigest = await sha256Hex(`${salt}:${password}`);
  return actualDigest === expectedDigest;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(readStoredSession);
  const [passwordHash, setPasswordHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refreshPasswordHash() {
    const settingsRes = await fetchSettingsListRpc();
    const passwordSetting = settingsRes.data.find((item) => item.key === DASHBOARD_PASSWORD_SETTING_KEY);
    setPasswordHash(passwordSetting?.value ?? null);
  }

  async function signIn(password: string): Promise<SignInResult> {
    const nextHash = passwordHash ?? await (async () => {
      const settingsRes = await fetchSettingsListRpc();
      const passwordSetting = settingsRes.data.find((item) => item.key === DASHBOARD_PASSWORD_SETTING_KEY);
      const storedHash = passwordSetting?.value ?? null;
      setPasswordHash(storedHash);
      return storedHash;
    })();

    if (!nextHash) {
      return 'password_not_configured';
    }

    const isValid = await verifyDashboardPassword(password, nextHash);

    if (!isValid) {
      return 'invalid_password';
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
    }

    setIsAuthenticated(true);
    return 'success';
  }

  async function signOut() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }

    setIsAuthenticated(false);
  }

  useEffect(() => {
    let isActive = true;

    async function loadAuthState() {
      const settingsRes = await fetchSettingsListRpc();

      if (!isActive) {
        return;
      }

      const passwordSetting = settingsRes.data.find((item) => item.key === DASHBOARD_PASSWORD_SETTING_KEY);
      setPasswordHash(passwordSetting?.value ?? null);
      setLoading(false);
    }

    void loadAuthState();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        signIn,
        signOut,
        refreshPasswordHash,
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
