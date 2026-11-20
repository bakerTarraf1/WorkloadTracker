import api from './axios';

export const getLeaderboard = async () => {
  const res = await api.get('/leaderboard');
  return res.data;
};