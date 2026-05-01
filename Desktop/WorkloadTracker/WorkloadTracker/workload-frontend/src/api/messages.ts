import api from './axios';

export const getConversations = async () => {
  const res = await api.get('/messages/conversations');
  return res.data;
};

export const getMessages = async (otherUserId: string) => {
  const res = await api.get(`/messages/${otherUserId}`);
  return res.data;
};

export const sendMessage = async (receiverId: string, content: string) => {
  const res = await api.post('/messages', { receiverId, content });
  return res.data;
};

export const getUnreadMessagesCount = async () => {
  const res = await api.get('/messages/unread-count');
  return res.data;
};

export const getMembers = async () => {
  const res = await api.get('/messages/members');
  return res.data;
};