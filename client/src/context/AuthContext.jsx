import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/resources';
import { friendlyApiError, setAccessToken, setUnauthorizedHandler } from '../api/client';
import { disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

function userFromAuthPayload(payload) {
  return payload?.user || payload?.account || payload?.data?.user || null;
}

function tokenFromAuthPayload(payload) {
  return payload?.accessToken || payload?.token || payload?.data?.accessToken || null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    disconnectSocket();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    const controller = new AbortController();

    authApi.me(controller.signal)
      .then((payload) => setUser(userFromAuthPayload(payload) || payload))
      .catch(() => clearSession())
      .finally(() => setIsBootstrapping(false));

    return () => {
      controller.abort();
      setUnauthorizedHandler(null);
    };
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    try {
      const payload = await authApi.login(credentials);
      const nextUser = userFromAuthPayload(payload);
      if (!nextUser) throw new Error('INVALID_AUTH_RESPONSE');
      setAccessToken(tokenFromAuthPayload(payload));
      setUser(nextUser);
      return nextUser;
    } catch (error) {
      throw new Error(error.message === 'INVALID_AUTH_RESPONSE'
        ? 'Máy chủ trả về dữ liệu đăng nhập không hợp lệ.'
        : friendlyApiError(error, 'Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.'));
    }
  }, []);

  const register = useCallback(async (payload) => {
    try {
      return await authApi.register(payload);
    } catch (error) {
      throw new Error(friendlyApiError(error, 'Không thể tạo tài khoản. Vui lòng thử lại.'));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // The local session is still cleared if the network request cannot finish.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(() => ({
    user,
    isBootstrapping,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    hasRole: (...roles) => Boolean(user?.role && roles.includes(user.role)),
  }), [user, isBootstrapping, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải được dùng bên trong AuthProvider.');
  return context;
}
