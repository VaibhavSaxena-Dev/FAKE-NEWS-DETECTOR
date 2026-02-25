import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      api.getUser(token).then(({ user }) => {
        setUser(user);
        setLoading(false);
      }).catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token]);

  const signUp = async (email, password, username) => {
    try {
      const data = await api.signUp(email, password, username);
      if (data.error) {
        return { error: { message: data.error } };
      }
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { error: null };
    } catch (error) {
      return { error: { message: error.message } };
    }
  };

  const signIn = async (email, password) => {
    try {
      const data = await api.signIn(email, password);
      if (data.error) {
        return { error: { message: data.error } };
      }
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { error: null };
    } catch (error) {
      return { error: { message: error.message } };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
