import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, getUser, setToken, setUser } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUserState(getUser());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const isLoginPage = router.pathname === '/login';
    if (!user && !isLoginPage) router.replace('/login');
    if (user && isLoginPage) router.replace('/');
  }, [ready, user, router.pathname]);

  async function login(username, password) {
    const data = await api.login(username, password);
    setToken(data.token);
    setUser(data.user);
    setUserState(data.user);
    router.replace('/');
  }

  async function logout() {
    try {
      await api.logout();
    } catch (e) {
      // ignore network errors on logout
    }
    setToken(null);
    setUser(null);
    setUserState(null);
    router.replace('/login');
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
