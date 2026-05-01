import api from './axios';

export const getProfile = async () => {
  const res = await api.get('/profile');
  return res.data;
};

export const updateProfile = async (data: {
  fullName: string;
  phoneNumber?: string;
}) => {
  const res = await api.put('/profile', data);
  return res.data;
};