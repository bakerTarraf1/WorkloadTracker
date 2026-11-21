import { useEffect, useState, useRef } from 'react';
import {
  Box, Typography, Paper, TextField, Button,
  Avatar, Badge, Divider, CircularProgress
} from '@mui/material';
import Navbar from '../components/Navbar';
import { getConversations, getMessages, sendMessage, getMembers } from '../api/messages';

const MessagesPage = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showList, setShowList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
      const interval = setInterval(() => loadMessages(selectedUser.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadData = async () => {
    try {
      const [membersData, conversationsData] = await Promise.all([getMembers(), getConversations()]);
      setMembers(membersData);
      setConversations(conversationsData);
    } catch {}
  };

  const loadMessages = async (userId: string) => {
    try {
      const data = await getMessages(userId);
      setMessages(data);
    } catch {}
  };

  const handleSelectUser = async (member: any) => {
    setSelectedUser(member);
    setShowList(false);
    setLoading(true);
    try {
      const data = await getMessages(member.id);
      setMessages(data);
    } catch {}
    setLoading(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    setSending(true);
    try {
      await sendMessage(selectedUser.id, newMessage.trim());
      setNewMessage('');
      await loadMessages(selectedUser.id);
      await loadData();
    } catch {}
    setSending(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getConversationData = (memberId: string) =>
    conversations.find(c => c.userId === memberId);

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const allUsers = members.map(m => ({ ...m, ...getConversationData(m.id) }))
    .sort((a, b) => {
      if (a.lastMessageAt && b.lastMessageAt)
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      return 0;
    });

  return (
    <>
      <Navbar />
      <Box sx={{ p: { xs: 1.5, sm: 3 }, maxWidth: 1100, mx: 'auto' }}>
        <Typography variant="h5" fontWeight={800} mb={2} sx={{
          fontSize: { xs: '1.2rem', sm: '1.4rem' },
          background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          💬 Messages
        </Typography>

        <Box sx={{
          display: 'flex',
          gap: { xs: 0, sm: 2 },
          height: { xs: 'calc(100vh - 160px)', sm: '70vh' },
          minHeight: { xs: 500, sm: 'auto' },
          position: 'relative',
        }}>

          {/* Members List */}
          <Paper sx={{
            width: { xs: showList ? '100%' : '0', sm: 280 },
            overflow: 'hidden',
            display: { xs: showList ? 'flex' : 'none', sm: 'flex' },
            flexDirection: 'column',
            flexShrink: 0,
            transition: 'all 0.3s ease',
          }}>
            <Box sx={{ p: 2, borderBottom: '1.5px solid #e8e8f0' }}>
              <Typography fontWeight={700} sx={{ color: '#1a1a2e', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                👥 Team Members
              </Typography>
            </Box>
            <Box sx={{ overflowY: 'auto', flex: 1 }}>
              {allUsers.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography sx={{ color: '#8888aa', fontSize: '0.875rem' }}>No members found</Typography>
                </Box>
              ) : (
                allUsers.map(member => (
                  <Box
                    key={member.id}
                    onClick={() => handleSelectUser(member)}
                    sx={{
                      p: { xs: 1.5, sm: 2 }, cursor: 'pointer',
                      bgcolor: selectedUser?.id === member.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                      borderLeft: selectedUser?.id === member.id ? '3px solid #6366f1' : '3px solid transparent',
                      '&:hover': { bgcolor: 'rgba(99,102,241,0.05)' },
                      transition: 'all 0.2s',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Badge badgeContent={member.unreadCount || 0} color="error" invisible={!member.unreadCount}>
                        <Avatar sx={{
                          width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 },
                          fontWeight: 800, fontSize: '0.9rem',
                          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        }}>
                          {member.fullName?.charAt(0).toUpperCase()}
                        </Avatar>
                      </Badge>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} sx={{
                          color: '#1a1a2e', fontSize: { xs: '0.82rem', sm: '0.875rem' },
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {member.fullName}
                        </Typography>
                        {member.lastMessage && (
                          <Typography variant="caption" sx={{
                            color: '#8888aa', display: 'block',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            fontSize: '0.72rem'
                          }}>
                            {member.lastMessage}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Paper>

          {/* Chat Area */}
          <Paper sx={{
            flex: 1, display: { xs: showList ? 'none' : 'flex', sm: 'flex' },
            flexDirection: 'column', overflow: 'hidden',
          }}>
            {!selectedUser ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '3rem' }}>💬</Typography>
                <Typography variant="h6" sx={{ color: '#8888aa', mt: 1, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                  Select a member to chat
                </Typography>
              </Box>
            ) : (
              <>
                {/* Chat Header */}
                <Box sx={{
                  p: { xs: 1.5, sm: 2 }, borderBottom: '1.5px solid #e8e8f0',
                  display: 'flex', alignItems: 'center', gap: 1.5
                }}>
                  {/* Back button on mobile */}
                  <Button
                    onClick={() => setShowList(true)}
                    sx={{
                      display: { xs: 'flex', sm: 'none' },
                      minWidth: 'auto', p: 0.5,
                      color: '#8888aa', mr: 0.5
                    }}
                  >
                    ←
                  </Button>
                  <Avatar sx={{
                    width: { xs: 34, sm: 38 }, height: { xs: 34, sm: 38 },
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  }}>
                    {selectedUser.fullName?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={700} sx={{ color: '#1a1a2e', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                      {selectedUser.fullName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>● Online</Typography>
                  </Box>
                </Box>

                {/* Messages */}
                <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, sm: 2 } }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                      <CircularProgress size={28} sx={{ color: '#6366f1' }} />
                    </Box>
                  ) : messages.length === 0 ? (
                    <Box sx={{ textAlign: 'center', pt: 4 }}>
                      <Typography sx={{ color: '#8888aa', fontSize: '0.875rem' }}>No messages yet — say hi! 👋</Typography>
                    </Box>
                  ) : (
                    messages.map(msg => (
                      <Box key={msg.id} sx={{
                        display: 'flex',
                        justifyContent: msg.isMine ? 'flex-end' : 'flex-start',
                        mb: 1.5
                      }}>
                        {!msg.isMine && (
                          <Avatar sx={{
                            width: 26, height: 26, mr: 1, fontSize: '0.65rem',
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            alignSelf: 'flex-end', flexShrink: 0,
                          }}>
                            {selectedUser.fullName?.charAt(0).toUpperCase()}
                          </Avatar>
                        )}
                        <Box sx={{ maxWidth: { xs: '80%', sm: '70%' } }}>
                          <Box sx={{
                            px: { xs: 1.5, sm: 2 }, py: { xs: 0.8, sm: 1 },
                            borderRadius: msg.isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: msg.isMine
                              ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                              : '#f4f4f8',
                            boxShadow: msg.isMine ? '0 2px 12px rgba(99,102,241,0.3)' : 'none',
                          }}>
                            <Typography variant="body2" sx={{
                              color: msg.isMine ? '#ffffff' : '#1a1a2e',
                              fontSize: { xs: '0.82rem', sm: '0.875rem' },
                              lineHeight: 1.5,
                            }}>
                              {msg.content}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{
                            color: '#8888aa', mt: 0.3, display: 'block',
                            textAlign: msg.isMine ? 'right' : 'left',
                            fontSize: '0.65rem',
                          }}>
                            {formatTime(msg.createdAt)}
                            {msg.isMine && <span style={{ marginLeft: 4 }}>{msg.isRead ? ' ✓✓' : ' ✓'}</span>}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </Box>

                <Divider />

                {/* Input */}
                <Box sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    sx={{
                      borderRadius: '12px',
                      minWidth: { xs: 44, sm: 80 },
                      px: { xs: 1.5, sm: 2.5 },
                      py: { xs: 1, sm: 1 },
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    }}
                  >
                    {sending ? <CircularProgress size={16} color="inherit" /> : '➤'}
                  </Button>
                </Box>
              </>
            )}
          </Paper>
        </Box>
      </Box>
    </>
  );
};

export default MessagesPage;