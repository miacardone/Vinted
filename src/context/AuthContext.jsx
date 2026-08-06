import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import authService from '@/services/auth.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | authenticating
  const [error, setError] = useState(null);

  useEffect(() => {
    const session = authService.readSession();
    if (session?.user) setUser(session.user);
    setStatus('ready');
  }, []);

  const signIn = useCallback(async (credentials) => {
    setStatus('authenticating');
    setError(null);
    try {
      const session = await authService.login(credentials);
      authService.writeSession(session);
      setUser(session.user);
      return session.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setStatus('ready');
    }
  }, []);

  const signOut = useCallback(async () => {
    await authService.logout();
    authService.clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, status, error, signIn, signOut, isAuthenticated: Boolean(user) }),
    [user, status, error, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthProvider;
