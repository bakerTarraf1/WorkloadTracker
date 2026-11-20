import api from './axios';

export const login = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const register = async (data: {
  fullName: string;
  email: string;
  password: string;
  role: string;
}) => {
  const res = await api.post('/auth/register', data);
  return res.data;
};

export const forgotPassword = async (email: string) => {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
};

export const verifyCode = async (email: string, code: string) => {
  const res = await api.post('/auth/verify-code', { email, code });
  return res.data;
};

export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string
) => {
  const res = await api.post('/auth/reset-password', { email, code, newPassword });
  return res.data;
};