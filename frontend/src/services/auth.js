import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'meeting_app_token';
const USER_KEY = 'meeting_app_user';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Login with username and password
 */
export const login = async (username, password) => {
  try {
    const response = await api.post('/api/auth/login', { username, password });
    if (response.data.success) {
      // Store token and user info
      localStorage.setItem(TOKEN_KEY, response.data.data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.data.user));
      return { success: true, data: response.data.data };
    }
    return { success: false, error: response.data.message || 'Login failed' };
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
    return { success: false, error: errorMessage };
  }
};

/**
 * Logout - clear stored token and user info
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem(TOKEN_KEY);
};

/**
 * Get stored authentication token
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get stored user info
 */
export const getUser = () => {
  const userStr = localStorage.getItem(USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
  return null;
};

/**
 * Verify token with backend
 */
export const verifyToken = async () => {
  const token = getToken();
  if (!token) {
    return { success: false, error: 'No token found' };
  }

  try {
    const response = await api.post('/api/auth/verify', { token });
    return { success: response.data.success, data: response.data.data };
  } catch (error) {
    // Token is invalid or expired
    logout();
    return { success: false, error: 'Token verification failed' };
  }
};

