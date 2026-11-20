import api from './axios';

export const getAllTasks = async () => {
  const res = await api.get('/tasks');
  return res.data;
};

export const getTaskById = async (id: number) => {
  const res = await api.get(`/tasks/${id}`);
  return res.data;
};

export const createTask = async (data: any) => {
  const res = await api.post('/tasks', data);
  return res.data;
};

export const updateTask = async (id: number, data: any) => {
  const res = await api.put(`/tasks/${id}`, data);
  return res.data;
};

export const updateTaskStatus = async (id: number, status: number, userId: string) => {
  const res = await api.put(`/tasks/${id}/status`, { status, userId });
  return res.data;
};

export const acknowledgeTask = async (id: number) => {
  const res = await api.put(`/tasks/${id}/acknowledge`);
  return res.data;
};

export const getWorkload = async (startDate: string, endDate: string) => {
  const res = await api.get(`/tasks/workload?startDate=${startDate}&endDate=${endDate}`);
  return res.data;
};

export const getThisWeekWorkload = async () => {
  const res = await api.get('/tasks/workload/thisweek');
  return res.data;
};

export const getNextWeekWorkload = async () => {
  const res = await api.get('/tasks/workload/nextweek');
  return res.data;
};

// ← جديد
export const suggestAssignee = async (data: {
  taskTitle: string;
  taskDescription: string;
  priority: string;
  complexity: string;
  effortHours: number;
}) => {
  const res = await api.post('/ai/suggest-assignee', data);
  return res.data;
};