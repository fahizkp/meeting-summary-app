import axios from 'axios';
import { getToken } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getAuthConfig = () => ({
  headers: {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  },
});

export const getAllUsers = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/users`, getAuthConfig());
  return response.data;
};

export const createUser = async (userData) => {
  const response = await axios.post(`${API_BASE_URL}/api/users`, userData, getAuthConfig());
  return response.data;
};

export const updateUser = async (username, userData) => {
  const response = await axios.put(`${API_BASE_URL}/api/users/${username}`, userData, getAuthConfig());
  return response.data;
};

export const deleteUser = async (username) => {
  const response = await axios.delete(`${API_BASE_URL}/api/users/${username}`, getAuthConfig());
  return response.data;
};
