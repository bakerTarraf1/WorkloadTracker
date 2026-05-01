import api from './axios';

export const getAllUsers = async () => {
  const res = await api.get('/users');
  return res.data;
};

export const getUserById = async (id: string) => {
  const res = await api.get(`/users/${id}`);
  return res.data;
};

export const changeUserRole = async (id: string, role: string) => {
  const res = await api.put(`/users/${id}/role`, { role });
  return res.data;
};

export const updateUserName = async (id: string, fullName: string) => {
  const res = await api.put(`/users/${id}/name`, { fullName });
  return res.data;
};

export const deleteUser = async (id: string) => {
  const res = await api.delete(`/users/${id}`);
  return res.data;
};