import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent,
  Button, TextField, Chip, Skeleton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getThisWeekWorkload, getNextWeekWorkload, getWorkload } from '../api/tasks';
import { WorkloadMember } from '../types';
import WorkloadBadge from '../components/WorkloadBadge';
import Navbar from '../components/Navbar';

const DashboardPage = () => {
  const [members, setMembers] = useState<WorkloadMember[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeRange, setActiveRange] = useState<'this' | 'next' | 'custom'>('this');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadThisWeek = async () => {
    setLoading(true);
    const data = await getThisWeekWorkload();
    setMembers(data); setActiveRange('this'); setLoading(false);
  };

  const loadNextWeek = async () => {
    setLoading(true);
    const data = await getNextWeekWorkload();
    setMembers(data); setActiveRange('next'); setLoading(false);
  };

  const loadCustom = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    const data = await getWorkload(startDate, endDate);
    setMembers(data); setActiveRange('custom'); setLoading(false);
  };

  useEffect(() => { loadThisWeek(); }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Available': return { color: '#059669', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' };
      case 'Moderate': return { color: '#d97706', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' };
      default: return { color: '#dc2626', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' };
    }
  };

  return (
    <>
      <Navbar />
      <Box sx={{
        p: { xs: 1.5, sm: 2.5, md: 3 },
        maxWidth: 1280, mx: 'auto',
        overflowX: 'hidden',
      }}>

        {/* Header */}
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography fontWeight={900} sx={{
            fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.8rem' },
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Workload Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: '#8888aa', mt: 0.5, fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
            {members.length} team members ·{' '}
            {activeRange === 'this' ? 'This Week' : activeRange === 'next' ? 'Next Week' : 'Custom Range'}
          </Typography>
        </Box>

        {/* Filter Bar */}
        <Box sx={{
          mb: { xs: 2, sm: 3 },
          p: { xs: 1.5, sm: 2 },
          background: '#ffffff',
          border: '1.5px solid #e8e8f0',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(99,102,241,0.06)',
        }}>

          {/* Week Buttons */}
          <Box sx={{ display: 'flex', gap: 1, mb: { xs: 1.5, sm: 0 }, flexWrap: 'wrap' }}>
            <Button
              onClick={loadThisWeek}
              variant={activeRange === 'this' ? 'contained' : 'outlined'}
              size="small"
              sx={{
                borderRadius: '10px', fontSize: { xs: '0.78rem', sm: '0.82rem' },
                px: { xs: 1.5, sm: 2 }, flex: { xs: 1, sm: 'none' },
                ...(activeRange !== 'this' && { borderColor: '#e8e8f0', color: '#8888aa' })
              }}
            >
              This Week
            </Button>
            <Button
              onClick={loadNextWeek}
              variant={activeRange === 'next' ? 'contained' : 'outlined'}
              size="small"
              sx={{
                borderRadius: '10px', fontSize: { xs: '0.78rem', sm: '0.82rem' },
                px: { xs: 1.5, sm: 2 }, flex: { xs: 1, sm: 'none' },
                ...(activeRange !== 'next' && { borderColor: '#e8e8f0', color: '#8888aa' })
              }}
            >
              Next Week
            </Button>
          </Box>

          {/* Date Pickers */}
          <Box sx={{
            display: 'flex', gap: 1, mt: { xs: 0, sm: 1.5 },
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
          }}>
            <TextField
              type="date" label="Start Date" size="small"
              InputLabelProps={{ shrink: true }}
              value={startDate} onChange={e => setStartDate(e.target.value)}
              fullWidth sx={{ maxWidth: { sm: 180 } }}
            />
            <TextField
              type="date" label="End Date" size="small"
              InputLabelProps={{ shrink: true }}
              value={endDate} onChange={e => setEndDate(e.target.value)}
              fullWidth sx={{ maxWidth: { sm: 180 } }}
            />
            <Button
              onClick={loadCustom} variant="outlined" size="small"
              sx={{
                borderRadius: '10px', px: 2,
                whiteSpace: 'nowrap', fontSize: '0.82rem',
                borderColor: '#6366f1', color: '#6366f1',
                '&:hover': { bgcolor: 'rgba(99,102,241,0.06)' }
              }}
            >
              Apply
            </Button>
          </Box>
        </Box>

        {/* Summary Stats */}
        {members.length > 0 && (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(3, 200px)' },
            gap: { xs: 1, sm: 1.5 },
            mb: { xs: 2, sm: 3 },
          }}>
            {[
              { label: 'Available', value: members.filter(m => m.status === 'Available').length, color: '#059669', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', icon: '🟢' },
              { label: 'Moderate', value: members.filter(m => m.status === 'Moderate').length, color: '#d97706', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', icon: '🟡' },
              { label: 'Overloaded', value: members.filter(m => m.status === 'Overloaded').length, color: '#dc2626', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', icon: '🔴' },
            ].map(stat => (
              <Box key={stat.label} sx={{
                background: stat.bg, border: `1.5px solid ${stat.border}`,
                borderRadius: { xs: '12px', sm: '14px' }, p: { xs: 1.5, sm: 2 },
                textAlign: 'center',
              }}>
                <Typography sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>{stat.icon}</Typography>
                <Typography fontWeight={900} sx={{
                  color: stat.color, fontSize: { xs: '1.5rem', sm: '1.8rem' }, lineHeight: 1.1, mt: 0.3
                }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" sx={{
                  color: stat.color, fontWeight: 700,
                  fontSize: { xs: '0.62rem', sm: '0.68rem' },
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Member Cards */}
        {loading ? (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: { xs: 1.5, sm: 2 },
          }}>
            {[1, 2, 3, 4].map(i => (
              <Box key={i} sx={{ borderRadius: '16px', overflow: 'hidden', border: '1.5px solid #e8e8f0', p: 2 }}>
                <Skeleton variant="rectangular" height={60} sx={{ borderRadius: '10px', mb: 1.5 }} />
                <Skeleton height={20} width="60%" sx={{ mb: 1 }} />
                <Skeleton height={16} width="80%" />
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
            gap: { xs: 1.5, sm: 2, md: 2.5 },
          }}>
            {members.map((member, index) => {
              const statusStyle = getStatusStyle(member.status);
              return (
                <Card
                  key={member.userId}
                  onClick={() => navigate(`/members/${member.userId}`)}
                  sx={{
                    cursor: 'pointer',
                    border: `1.5px solid ${statusStyle.border}`,
                    background: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 2px 8px rgba(99,102,241,0.06)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    animation: `fadeUp 0.4s ease ${index * 0.06}s both`,
                    '@keyframes fadeUp': {
                      from: { opacity: 0, transform: 'translateY(16px)' },
                      to: { opacity: 1, transform: 'translateY(0)' },
                    },
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: `0 12px 32px ${statusStyle.border}`,
                      border: `1.5px solid ${statusStyle.color}`,
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
                    {/* Avatar + Name */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Box sx={{
                        width: { xs: 44, sm: 48 }, height: { xs: 44, sm: 48 },
                        borderRadius: '14px', flexShrink: 0,
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 900,
                        fontSize: { xs: '1.1rem', sm: '1.2rem' },
                        boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
                      }}>
                        {member.fullName.charAt(0).toUpperCase()}
                      </Box>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography fontWeight={800} sx={{
                          color: '#1a1a2e',
                          fontSize: { xs: '0.9rem', sm: '0.95rem' },
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {member.fullName}
                        </Typography>
                        <WorkloadBadge status={member.status} />
                      </Box>
                    </Box>

                    {/* Stats Grid */}
                    <Box sx={{
                      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: { xs: 0.8, sm: 1 },
                    }}>
                      {[
                        { label: 'Tasks', value: member.totalTasks },
                        { label: 'Hours', value: `${member.totalEffort}h` },
                        { label: 'Weight', value: member.totalWeight.toFixed(1) },
                      ].map(stat => (
                        <Box key={stat.label} sx={{
                          textAlign: 'center',
                          p: { xs: 0.8, sm: 1 },
                          background: 'rgba(99,102,241,0.04)',
                          borderRadius: '10px',
                          border: '1px solid rgba(99,102,241,0.08)',
                        }}>
                          <Typography fontWeight={900} sx={{
                            color: '#1a1a2e',
                            fontSize: { xs: '0.9rem', sm: '0.95rem' },
                            lineHeight: 1.2,
                          }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="caption" sx={{
                            color: '#8888aa', fontWeight: 700,
                            fontSize: { xs: '0.6rem', sm: '0.65rem' },
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                          }}>
                            {stat.label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {/* Empty State */}
        {!loading && members.length === 0 && (
          <Box sx={{
            textAlign: 'center', py: { xs: 6, sm: 10 },
            background: '#ffffff', borderRadius: '20px',
            border: '1.5px dashed #e8e8f0',
          }}>
            <Typography sx={{ fontSize: { xs: '2.5rem', sm: '3rem' } }}>📊</Typography>
            <Typography fontWeight={700} sx={{ color: '#4a4a6a', mt: 1, fontSize: { xs: '1rem', sm: '1.1rem' } }}>
              No workload data
            </Typography>
            <Typography variant="body2" sx={{ color: '#8888aa', mt: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              No members found for this period
            </Typography>
          </Box>
        )}
      </Box>
    </>
  );
};

export default DashboardPage;