import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('transitops_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Validate existing session token against server on initial mount
  useEffect(() => {
    const token = localStorage.getItem('transitops_token');
    if (!token) return;

    api
      .get('/auth/me')
      .then(({ data }) => {
        if (data.user) {
          localStorage.setItem('transitops_user', JSON.stringify(data.user));
          setUser(data.user);
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('transitops_token');
          localStorage.removeItem('transitops_user');
          setUser(null);
        }
      });
  }, []);

  const login = useCallback(async (email, password, role) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', { email, password, role });
      localStorage.setItem('transitops_token', data.token);
      localStorage.setItem('transitops_user', JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', payload);
      localStorage.setItem('transitops_token', data.token);
      localStorage.setItem('transitops_user', JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const googleLogin = useCallback(async (credential, role, adminSecretKey) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/google', { credential, role, adminSecretKey });
      localStorage.setItem('transitops_token', data.token);
      localStorage.setItem('transitops_user', JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Google authentication failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('transitops_token');
    localStorage.removeItem('transitops_user');
    setUser(null);
  }, []);

  const forgotPassword = useCallback(async (email, role) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email, role });
      return { ok: true, message: data.message, previewUrl: data.previewUrl };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit request.';
      setError(msg);
      return { ok: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email, otp, password) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/reset-password', { email, otp, password });
      return { ok: true, message: data.message };
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reset password.';
      setError(msg);
      return { ok: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        googleLogin,
        logout,
        forgotPassword,
        resetPassword,
        loading,
        error,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
