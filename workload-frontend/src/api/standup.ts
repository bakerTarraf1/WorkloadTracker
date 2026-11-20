import api from './axios';

export const generateStandup = async () => {
  const res = await api.get('/standup/generate');
  return res.data;
};

export const sendStandup = async () => {
  const res = await api.post('/standup/send');
  return res.data;
};