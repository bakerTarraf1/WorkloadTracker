import api from './axios';

export const getAllChangeRequests = async () => {
  const res = await api.get('/changerequests');
  return res.data;
};

export const createChangeRequest = async (data: {
  taskItemId: number;
  requestedByUserId: string;
  type: number;
  newValue: string;
}) => {
  const res = await api.post('/changerequests', data);
  return res.data;
};

export const approveChangeRequest = async (id: number) => {
  const res = await api.put(`/changerequests/${id}/approve`);
  return res.data;
};

export const rejectChangeRequest = async (id: number) => {
  const res = await api.put(`/changerequests/${id}/reject`);
  return res.data;
};