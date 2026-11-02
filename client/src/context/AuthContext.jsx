import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/index.js';

const AuthContext = createContext(null);

const RANK = { USER: 1, EDITOR: 2, ADMIN: 3 };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (creds) => {
    const { data } = await authApi.login(creds);
    setUser(data);
    return data;
  }, []);

  const register = useCallback(async (body) => {
    const { data } = await authApi.register(body);
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      refresh,
      login,
      register,
      logout,
      hasRole: (role) => Boolean(user) && RANK[user.role] >= RANK[role],
    }),
    [user, loading, refresh, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>.');
  return ctx;
}
