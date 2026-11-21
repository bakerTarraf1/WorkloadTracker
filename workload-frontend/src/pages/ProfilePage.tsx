import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button,
  Alert, Avatar, Divider, Chip, LinearProgress
} from '@mui/material';
import { getProfile, updateProfile } from '../api/profile';
import { getStatusLabel, getPriorityLabel } from '../utils/workload';
import Navbar from '../components/Navbar';

const ProfilePage = () => {
  const [profile, setProfile] = useState<any>(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProfile().then(data => {
      setProfile(data);
      setFullName(data.fullName);
      setPhoneNumber(data.phoneNumber || '');
    });
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await updateProfile({ fullName, phoneNumber });
      setSuccess('Profile updated! ✅');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to update profile');
    }
    setLoading(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return '#dc2626';
      case 'TeamLeader': return '#d97706';
      default: return '#059669';
    }
  };

  const getStatusColor = (status: number) => {
    const colors: any = { 3: '#059669', 1: '#6366f1', 2: '#dc2626', 0: '#8888aa' };
    return colors[status] || '#8888aa';
  };

  if (!profile) return (
    <>
      <Navbar />
      <Box p={3}><Typography>Loading...</Typography></Box>
    </>
  );

  return (
    <>
      <Navbar />
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1000, mx: 'auto' }}>
        <Typography variant="h5" fontWeight={800} mb={3} sx={{
          fontSize: { xs: '1.3rem', sm: '1.5rem' },
          background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          👤 My Profile
        </Typography>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1.4fr' },
          gap: { xs: 2, sm: 3 },
        }}>
          {/* Left */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>

            {/* Profile Card */}
            <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                <Avatar sx={{
                  width: { xs: 56, sm: 68 }, height: { xs: 56, sm: 68 },
                  fontSize: { xs: '1.4rem', sm: '1.8rem' }, fontWeight: 800,
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                }}>
                  {fullName?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{ color: '#1a1a2e', fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                    {profile.fullName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8888aa', fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
                    {profile.email}
                  </Typography>
                  <Chip label={profile.role} size="small" sx={{
                    mt: 0.5,
                    bgcolor: `${getRoleColor(profile.role)}12`,
                    color: getRoleColor(profile.role),
                    border: `1.5px solid ${getRoleColor(profile.role)}30`,
                    fontWeight: 700, fontSize: '0.7rem',
                  }} />
                </Box>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.8rem' }}>{success}</Alert>}
              {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.8rem' }}>{error}</Alert>}

              <TextField fullWidth label="Full Name" value={fullName}
                onChange={e => setFullName(e.target.value)} sx={{ mb: 2 }} />
              <TextField fullWidth label="Email" value={profile.email} disabled sx={{ mb: 2 }} />
              <TextField fullWidth label="Phone Number" value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)} sx={{ mb: 2.5 }} />

              <Button fullWidth variant="contained" onClick={handleSave}
                disabled={loading} sx={{ py: { xs: 1.2, sm: 1.5 }, borderRadius: '12px', fontWeight: 700 }}>
                💾 Save Changes
              </Button>
            </Paper>

            {/* Stats */}
            <Paper sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                📊 My Statistics
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                  <Typography variant="body2" sx={{ color: '#4a4a6a', fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Completion Rate
                  </Typography>
                  <Typography variant="body2" fontWeight={800} sx={{ color: '#059669' }}>
                    {profile.stats.completionRate}%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={profile.stats.completionRate}
                  sx={{
                    height: { xs: 8, sm: 10 }, borderRadius: '10px',
                    bgcolor: 'rgba(16,185,129,0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(135deg, #10b981, #34d399)',
                      borderRadius: '10px',
                    }
                  }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              {[
                { label: '📋 Total Tasks', value: profile.stats.totalTasks, color: '#1a1a2e' },
                { label: '✅ Completed', value: profile.stats.completedTasks, color: '#059669' },
                { label: '⚡ In Progress', value: profile.stats.inProgressTasks, color: '#6366f1' },
                { label: '🚫 Blocked', value: profile.stats.blockedTasks, color: '#dc2626' },
                { label: '⚖️ Weight Done', value: profile.stats.totalWeightCompleted?.toFixed(1), color: '#a855f7' },
                { label: '⏱️ Avg Effort', value: `${profile.stats.averageEffortHours} hrs`, color: '#1a1a2e' },
              ].map(stat => (
                <Box key={stat.label} sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  py: 1, borderBottom: '1px solid #f0f0f8',
                  '&:last-child': { borderBottom: 'none' }
                }}>
                  <Typography variant="body2" sx={{ color: '#4a4a6a', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    {stat.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={800} sx={{ color: stat.color }}>
                    {stat.value}
                  </Typography>
                </Box>
              ))}

              <Box sx={{
                mt: 2, p: { xs: 1.5, sm: 2 }, borderRadius: '12px',
                background: 'rgba(245,158,11,0.06)',
                border: '1.5px solid rgba(245,158,11,0.2)',
              }}>
                <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 700, display: 'block', mb: 0.5, fontSize: '0.7rem' }}>
                  🏆 Heaviest Task Completed
                </Typography>
                <Typography variant="body2" fontWeight={600} sx={{ color: '#1a1a2e', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  {profile.stats.heaviestTask}
                </Typography>
                <Typography variant="caption" sx={{ color: '#8888aa' }}>
                  Weight: {profile.stats.heaviestTaskWeight?.toFixed(1)}
                </Typography>
              </Box>
            </Paper>
          </Box>

          {/* Right — Task History */}
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" fontWeight={700} mb={2} sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
              📅 Recent Tasks
            </Typography>

            {profile.taskHistory.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{ fontSize: '2.5rem' }}>📋</Typography>
                <Typography sx={{ color: '#8888aa', mt: 1 }}>No tasks yet</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {profile.taskHistory.map((task: any) => (
                  <Box key={task.id} sx={{
                    p: { xs: 1.5, sm: 2 }, borderRadius: '12px',
                    background: 'rgba(99,102,241,0.02)',
                    border: '1.5px solid #e8e8f0',
                    transition: 'all 0.2s',
                    '&:hover': { border: '1.5px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.03)' }
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'flex-start' }}>
                      <Typography variant="body2" fontWeight={700} sx={{
                        color: '#1a1a2e', flex: 1, mr: 1,
                        fontSize: { xs: '0.82rem', sm: '0.875rem' }
                      }}>
                        {task.title}
                      </Typography>
                      <Chip label={getStatusLabel(task.status)} size="small" sx={{
                        bgcolor: `${getStatusColor(task.status)}12`,
                        color: getStatusColor(task.status),
                        border: `1px solid ${getStatusColor(task.status)}25`,
                        fontWeight: 700, fontSize: '0.65rem', flexShrink: 0,
                      }} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: { xs: 0.8, sm: 1.5 }, flexWrap: 'wrap' }}>
                      {[
                        { label: getPriorityLabel(task.priority), color: '#4a4a6a' },
                        { label: `${task.effortHours}h`, color: '#4a4a6a' },
                        { label: `⚖️ ${task.weight?.toFixed(1)}`, color: '#6366f1' },
                        { label: new Date(task.dueDate).toLocaleDateString(), color: '#8888aa' },
                      ].map((info, i) => (
                        <Typography key={i} variant="caption" sx={{
                          color: info.color, fontWeight: 600,
                          fontSize: { xs: '0.68rem', sm: '0.72rem' }
                        }}>
                          {i > 0 && <span style={{ color: '#e0e0f0', marginRight: 4 }}>•</span>}
                          {info.label}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </>
  );
};

export default ProfilePage;