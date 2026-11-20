import api from './axios';

export const getAllTeams = async () => {
  const res = await api.get('/teams');
  return res.data;
};

export const createTeam = async (name: string) => {
  const res = await api.post('/teams', { name });
  return res.data;
};

export const addMemberToTeam = async (teamId: number, userId: string) => {
  const res = await api.post(`/teams/${teamId}/members`, { userId });
  return res.data;
};

export const getTeamMembers = async (teamId: number) => {
  const res = await api.get(`/teams/${teamId}/members`);
  return res.data;
};