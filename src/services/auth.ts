import axios from 'axios';
import { User } from '../types';

// Simplified API URL resolution using Vite's environment detection
const getApiUrl = () => {
  // In development, use Vite proxy
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production, use relative API path
  return '/api';
};

const API_BASE_URL = getApiUrl();

console.log('Auth API URL:', API_BASE_URL); // Debug log

// Configure axios defaults
axios.defaults.timeout = 10000; // 10 second timeout
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const authService = {
  async login(username: string, password: string) {
    try {
      console.log('Attempting login to:', `${API_BASE_URL}/auth/login`);
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      console.error('Login request failed:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
          throw new Error('Cannot connect to server. Please ensure the backend is running.');
        }
        if (error.response) {
          throw new Error(error.response.data?.message || 'Login failed');
        }
      }
      throw error;
    }
  },

  async validateToken(token: string): Promise<User | null> {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.user;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  },

  async getAllUsers(): Promise<User[]> {
    const response = await axios.get(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const response = await axios.post(`${API_BASE_URL}/users`, userData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await axios.put(`${API_BASE_URL}/users/${id}`, userData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
  },

  async deleteUser(id: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/users/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  },

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const response = await axios.post(`${API_BASE_URL}/users/${id}/change-password`, {
      currentPassword,
      newPassword
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return response.data;
  },
};