// Logged-in state, shared across every page. Persists the JWT in localStorage
// so the user stays logged in when they move between pages or refresh.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const TOKEN_KEY = 'yf_token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch (_) {
      return null;
    }
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);

  // When we have a token, load the current user. If the token is bad, drop it.
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    api
      .me(token)
      .then((d) => active && setUser(d.user))
      .catch(() => {
        if (!active) return;
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch (_) {
          /* ignore */
        }
        setToken(null);
        setUser(null);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  function applyAuth(data) {
    try {
      localStorage.setItem(TOKEN_KEY, data.token);
    } catch (_) {
      /* ignore */
    }
    setToken(data.token);
    setUser(data.user);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthed: !!user,
      login: async (identifier, password, rememberMe) => {
        const d = await api.login({ identifier, password, rememberMe });
        applyAuth(d);
        return d.user;
      },
      register: async (payload) => {
        const d = await api.register(payload);
        applyAuth(d);
        return d.user;
      },
      logout: () => {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch (_) {
          /* ignore */
        }
        setToken(null);
        setUser(null);
      },
      saveQuiz: async (skillLevel, quizScore) => {
        const d = await api.saveQuiz({ skillLevel, quizScore }, token);
        setUser(d.user);
        return d.user;
      },
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
