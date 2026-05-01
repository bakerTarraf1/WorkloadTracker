import { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box,
  Avatar, Chip, IconButton, Badge, Popover,
  List, ListItem, Divider, Drawer, ListItemButton,
  ListItemText, ListItemIcon
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getMyNotifications, getUnreadCount,
  markAsRead, markAllAsRead, deleteNotification
} from '../api/notifications';
import { getUnreadMessagesCount } from '../api/messages';

const BellIcon = () => <span style={{ fontSize: '20px' }}>🔔</span>;
const ChatIcon = () => <span style={{ fontSize: '20px' }}>💬</span>;
const MenuIcon = () => <span style={{ fontSize: '22px' }}>☰</span>;

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await getMyNotifications();
      setNotifications(data);
      const countData = await getUnreadCount();
      setUnreadCount(countData.count);
    } catch {}
  };

  const loadUnreadMessages = async () => {
    try {
      if (user?.role === 'Member') {
        const data = await getUnreadMessagesCount();
        setUnreadMessages(data.count);
      }
    } catch {}
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadNotifications();
    loadUnreadMessages();
    const interval = setInterval(() => {
      loadNotifications();
      loadUnreadMessages();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    loadNotifications();
  };

  const handleClose = () => setAnchorEl(null);

  const handleMarkAsRead = async (id: number) => {
    await markAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    loadNotifications();
  };

  const handleDelete = async (id: number) => {
    await deleteNotification(id);
    loadNotifications();
  };

  const handleNotificationClick = (n: any) => {
    if (n.type === 'daily_standup') {
      navigate('/standup-report', { state: { report: n.message } });
      handleClose();
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return '#dc2626';
      case 'TeamLeader': return '#d97706';
      default: return '#059669';
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned': return '📋';
      case 'task_updated': return '✏️';
      case 'task_acknowledged': return '✅';
      case 'change_request': return '📝';
      case 'request_approved': return '✅';
      case 'request_rejected': return '❌';
      case 'new_message': return '💬';
      case 'daily_standup': return '🧠';
      default: return '🔔';
    }
  };

  // Nav items
  const navItems = [
    { label: 'Dashboard', path: '/', icon: '📊', roles: ['Admin', 'TeamLeader', 'Member'] },
    { label: 'Leaderboard', path: '/leaderboard', icon: '🏆', roles: ['Admin', 'TeamLeader', 'Member'] },
    { label: '+ New Task', path: '/tasks/new', icon: '📋', roles: ['Admin', 'TeamLeader'] },
    { label: '🤖 AI Generator', path: '/ai-generator', icon: '🤖', roles: ['Admin', 'TeamLeader'] },
    { label: '📊 Reports', path: '/reports', icon: '📊', roles: ['Admin', 'TeamLeader'] },
    { label: '🧠 Standup', path: '/standup', icon: '🧠', roles: ['Admin', 'TeamLeader'] },
    { label: 'Changes', path: '/change-requests', icon: '📝', roles: ['Admin', 'TeamLeader', 'Member'] },
    { label: '💬 Messages', path: '/messages', icon: '💬', roles: ['Member'] },
    { label: '👑 Admin', path: '/admin', icon: '👑', roles: ['Admin'] },
  ].filter(item => item.roles.includes(user?.role || ''));

  return (
    <>
      <AppBar position="sticky">
        <Toolbar sx={{ px: { xs: 1.5, sm: 2, md: 3 }, minHeight: { xs: 56, sm: 64 } }}>

          {/* Hamburger — mobile only */}
          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{
              display: { xs: 'flex', md: 'none' },
              mr: 1, color: '#4a4a6a',
              '&:hover': { bgcolor: 'rgba(99,102,241,0.08)' }
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <Box onClick={() => navigate('/')} sx={{
            display: 'flex', alignItems: 'center',
            gap: { xs: 1, sm: 1.5 },
            cursor: 'pointer', mr: { xs: 'auto', md: 3 },
            '&:hover': { opacity: 0.8 }
          }}>
            <Box sx={{
              width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 },
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: { xs: '15px', sm: '18px' }, fontWeight: 900, color: 'white',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
              flexShrink: 0,
            }}>W</Box>
            <Typography fontWeight={900} sx={{
              fontSize: { xs: '1rem', sm: '1.1rem' },
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', display: { xs: 'block', sm: 'block' }
            }}>
              WorkloadTracker
            </Typography>
          </Box>

          {/* Desktop Nav Links */}
          <Box sx={{
            display: { xs: 'none', md: 'flex' },
            gap: 0.5, alignItems: 'center', flex: 1
          }}>
            {navItems.map(item => (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  color: isActive(item.path) ? '#6366f1' : '#4a4a6a',
                  bgcolor: isActive(item.path) ? 'rgba(99,102,241,0.08)' : 'transparent',
                  fontSize: '0.82rem', fontWeight: 600, px: 1.5, py: 0.8,
                  borderRadius: '10px', whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: 'rgba(99,102,241,0.08)', color: '#6366f1' }
                }}
              >
                {item.label}
                {item.path === '/messages' && unreadMessages > 0 && (
                  <Box component="span" sx={{
                    ml: 0.5, bgcolor: '#ef4444', color: 'white',
                    borderRadius: '10px', px: 0.8, py: 0.1,
                    fontSize: '0.6rem', fontWeight: 800,
                  }}>
                    {unreadMessages}
                  </Box>
                )}
              </Button>
            ))}
          </Box>

          <Box sx={{ flexGrow: { xs: 0, md: 1 } }} />

          {/* Notifications Bell */}
          <IconButton
            onClick={handleOpen}
            sx={{ color: '#4a4a6a', '&:hover': { color: '#6366f1', bgcolor: 'rgba(99,102,241,0.08)' } }}
          >
            <Badge badgeContent={unreadCount} color="error"
              sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
              <BellIcon />
            </Badge>
          </IconButton>

          {/* Avatar */}
          <Avatar
            onClick={() => navigate('/profile')}
            sx={{
              width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 },
              fontSize: { xs: '0.8rem', sm: '0.85rem' }, fontWeight: 800,
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              cursor: 'pointer', ml: 1,
              '&:hover': { boxShadow: '0 0 0 2px #6366f1' }
            }}
          >
            {user?.fullName?.charAt(0).toUpperCase()}
          </Avatar>

          {/* Name — desktop only */}
          <Typography
            variant="body2" fontWeight={700}
            onClick={() => navigate('/profile')}
            sx={{
              color: '#1a1a2e', cursor: 'pointer', ml: 1,
              display: { xs: 'none', sm: 'block' },
              fontSize: '0.85rem',
              '&:hover': { color: '#6366f1' }
            }}
          >
            {user?.fullName?.split(' ')[0]}
          </Typography>

          {/* Logout — desktop only */}
          <Button
            onClick={() => { logout(); navigate('/login'); }}
            size="small"
            sx={{
              display: { xs: 'none', sm: 'flex' },
              color: '#8888aa', ml: 1, fontSize: '0.8rem',
              '&:hover': { color: '#dc2626', bgcolor: 'rgba(239,68,68,0.06)' }
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            background: '#ffffff',
            border: 'none',
            boxShadow: '4px 0 24px rgba(99,102,241,0.12)',
          }
        }}
      >
        {/* Drawer Header */}
        <Box sx={{
          p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(236,72,153,0.05))',
          borderBottom: '1px solid #e8e8f0',
        }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', fontWeight: 900, color: 'white',
          }}>W</Box>
          <Box>
            <Typography fontWeight={900} sx={{
              fontSize: '1rem',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              WorkloadTracker
            </Typography>
            <Chip label={user?.role} size="small" sx={{
              bgcolor: `${getRoleColor(user?.role || '')}12`,
              color: getRoleColor(user?.role || ''),
              border: `1px solid ${getRoleColor(user?.role || '')}25`,
              fontWeight: 700, fontSize: '0.65rem', height: 18,
            }} />
          </Box>
        </Box>

        {/* User Info */}
        <Box sx={{
          px: 2.5, py: 2,
          display: 'flex', alignItems: 'center', gap: 1.5,
          borderBottom: '1px solid #e8e8f0',
        }}>
          <Avatar sx={{
            width: 44, height: 44, fontWeight: 800,
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          }}>
            {user?.fullName?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography fontWeight={700} sx={{ color: '#1a1a2e', fontSize: '0.9rem' }}>
              {user?.fullName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#8888aa', fontSize: '0.75rem' }}>
              {user?.email}
            </Typography>
          </Box>
        </Box>

        {/* Nav Items */}
        <List sx={{ py: 1, flex: 1 }}>
          {navItems.map(item => (
            <ListItemButton
              key={item.path}
              onClick={() => { navigate(item.path); setDrawerOpen(false); }}
              sx={{
                mx: 1.5, mb: 0.5, borderRadius: '12px',
                bgcolor: isActive(item.path) ? 'rgba(99,102,241,0.08)' : 'transparent',
                borderLeft: isActive(item.path) ? '3px solid #6366f1' : '3px solid transparent',
                '&:hover': { bgcolor: 'rgba(99,102,241,0.06)' },
                transition: 'all 0.2s',
              }}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 700 : 500,
                  color: isActive(item.path) ? '#6366f1' : '#4a4a6a',
                  fontSize: '0.9rem',
                }}
              />
              {item.path === '/messages' && unreadMessages > 0 && (
                <Box sx={{
                  bgcolor: '#ef4444', color: 'white', borderRadius: '10px',
                  px: 1, py: 0.2, fontSize: '0.65rem', fontWeight: 800,
                }}>
                  {unreadMessages}
                </Box>
              )}
            </ListItemButton>
          ))}
        </List>

        <Divider />

        {/* Logout */}
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth variant="outlined"
            onClick={() => { logout(); navigate('/login'); setDrawerOpen(false); }}
            sx={{
              borderRadius: '12px', borderColor: '#e8e8f0', color: '#8888aa',
              fontWeight: 600, py: 1,
              '&:hover': { borderColor: '#ef4444', color: '#dc2626', bgcolor: 'rgba(239,68,68,0.04)' }
            }}
          >
            🚪 Logout
          </Button>
        </Box>
      </Drawer>

      {/* Notifications Popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            bgcolor: '#ffffff', border: '1.5px solid #e8e8f0',
            borderRadius: '20px',
            width: { xs: 'calc(100vw - 32px)', sm: 380 },
            maxWidth: 380,
            maxHeight: 500, overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(99,102,241,0.12)',
          }
        }}
      >
        <Box sx={{
          p: 2, display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', borderBottom: '1.5px solid #e8e8f0',
        }}>
          <Typography fontWeight={800} sx={{ color: '#1a1a2e', fontSize: '0.95rem' }}>
            🔔 Notifications
            {unreadCount > 0 && (
              <Chip label={unreadCount} size="small" color="error"
                sx={{ ml: 1, height: 18, fontSize: '0.6rem' }} />
            )}
          </Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllAsRead}
              sx={{ color: '#6366f1', fontSize: '0.72rem', borderRadius: '8px' }}>
              Mark all read
            </Button>
          )}
        </Box>

        <Box sx={{ overflowY: 'auto', maxHeight: 420 }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography sx={{ color: '#8888aa', fontSize: '2rem' }}>🔔</Typography>
              <Typography sx={{ color: '#8888aa', mt: 1, fontSize: '0.875rem' }}>No notifications</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {notifications.map((n, index) => (
                <Box key={n.id}>
                  <ListItem
                    onClick={() => handleNotificationClick(n)}
                    sx={{
                      bgcolor: n.isRead ? 'transparent' : 'rgba(99,102,241,0.04)',
                      borderLeft: n.isRead ? 'none' : '3px solid #6366f1',
                      cursor: n.type === 'daily_standup' ? 'pointer' : 'default',
                      '&:hover': { bgcolor: n.type === 'daily_standup' ? 'rgba(99,102,241,0.06)' : 'rgba(0,0,0,0.01)' },
                      alignItems: 'flex-start', py: 1.5,
                    }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography sx={{ fontSize: '1rem' }}>{getNotificationIcon(n.type)}</Typography>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#1a1a2e', fontSize: '0.82rem' }}>
                          {n.title}
                        </Typography>
                        {n.type === 'daily_standup' && (
                          <Chip label="View" size="small" sx={{
                            bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1',
                            fontSize: '0.6rem', height: 16,
                          }} />
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: '#8888aa', display: 'block', mb: 0.5, fontSize: '0.75rem' }}>
                        {n.type === 'daily_standup' ? 'Click to view full report'
                          : n.message?.length > 70 ? n.message.substring(0, 70) + '...' : n.message}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#ccccdd', fontSize: '0.68rem' }}>
                        {new Date(n.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 1, flexShrink: 0 }}>
                      {!n.isRead && (
                        <IconButton size="small"
                          onClick={e => { e.stopPropagation(); handleMarkAsRead(n.id); }}
                          sx={{ color: '#6366f1', p: 0.5, fontSize: '0.8rem' }}>✓</IconButton>
                      )}
                      <IconButton size="small"
                        onClick={e => { e.stopPropagation(); handleDelete(n.id); }}
                        sx={{ color: '#dc2626', p: 0.5, fontSize: '0.8rem' }}>✕</IconButton>
                    </Box>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider sx={{ borderColor: '#f0f0f8' }} />}
                </Box>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
};

export default Navbar;