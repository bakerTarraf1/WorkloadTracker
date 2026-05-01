import api from './axios';

export const getAllMultipliers = async () => {
  const res = await api.get('/weightmultipliers');
  return res.data;
};

export const updateMultiplier = async (id: number, multiplier: number) => {
  const res = await api.put(`/weightmultipliers/${id}`, { multiplier });
  return res.data;
};