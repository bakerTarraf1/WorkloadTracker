import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Avatar, LinearProgress, Chip, Divider } from '@mui/material';
import { getLeaderboard } from '../api/leaderboard';
import Navbar from '../components/Navbar';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  useEffect(() => { getLeaderboard().then(setLeaderboard); }, []);

  const getMedalStyle = (i: number) => {
    const styles = [
      { bg: 'rgba(255,215,0,0.08)', border: 'rgba(255,215,0,0.3)', color: '#d97706', medal: '🥇', avatarBg: '#FFD700' },
      { bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.3)', color: '#64748b', medal: '🥈', avatarBg: '#94a3b8' },
      { bg: 'rgba(180,120,60,0.08)', border: 'rgba(180,120,60,0.3)', color: '#92400e', medal: '🥉', avatarBg: '#b07840' },
    ];
    return styles[i] || { bg: 'rgba(99,102,241,0.03)', border: '#e8e8f0', color: '#8888aa', medal: `#${i + 1}`, avatarBg: '#e8e8f0' };
  };

  const maxScore = leaderboard[0]?.score || 1;

  return (
    <>
      <Navbar />
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
          <Typography variant="h4" fontWeight={900} sx={{
            fontSize: { xs: '1.6rem', sm: '2rem' },
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', mb: 1,
          }}>
            🏆 Team Leaderboard
          </Typography>
          <Typography sx={{ color: '#8888aa', fontSize: { xs: '0.82rem', sm: '0.875rem' } }}>
            Ranked by completed tasks, weight & acknowledgements
          </Typography>
        </Box>

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <Box sx={{
            display: 'flex', gap: { xs: 1, sm: 2 },
            mb: { xs: 3, sm: 4 },
            justifyContent: 'center',
            alignItems: 'flex-end',
          }}>
            {/* 2nd */}
            <Box sx={{
              flex: '0 1 160px', textAlign: 'center',
              background: 'rgba(148,163,184,0.06)',
              border: '1.5px solid rgba(148,163,184,0.25)',
              borderRadius: '20px', p: { xs: 2, sm: 2.5 },
            }}>
              <Typography sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, mb: 1 }}>🥈</Typography>
              <Avatar sx={{
                width: { xs: 44, sm: 54 }, height: { xs: 44, sm: 54 },
                mx: 'auto', mb: 1, fontSize: { xs: '1rem', sm: '1.2rem' },
                fontWeight: 800, bgcolor: '#94a3b8', color: 'white',
              }}>
                {leaderboard[1].fullName.charAt(0)}
              </Avatar>
              <Typography fontWeight={700} sx={{ color: '#64748b', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                {leaderboard[1].fullName.split(' ')[0]}
              </Typography>
              <Typography variant="h6" fontWeight={900} sx={{ color: '#1a1a2e', fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                {leaderboard[1].score}
              </Typography>
              <Typography variant="caption" sx={{ color: '#8888aa', fontSize: '0.7rem' }}>pts</Typography>
            </Box>

            {/* 1st */}
            <Box sx={{
              flex: '0 1 180px', textAlign: 'center',
              background: 'rgba(255,215,0,0.06)',
              border: '2px solid rgba(255,215,0,0.3)',
              borderRadius: '20px', p: { xs: 2.5, sm: 3 },
              boxShadow: '0 8px 32px rgba(245,158,11,0.12)',
            }}>
              <Typography sx={{ fontSize: { xs: '2rem', sm: '2.5rem' }, mb: 1 }}>🥇</Typography>
              <Avatar sx={{
                width: { xs: 56, sm: 68 }, height: { xs: 56, sm: 68 },
                mx: 'auto', mb: 1, fontSize: { xs: '1.2rem', sm: '1.5rem' },
                fontWeight: 900, bgcolor: '#FFD700', color: '#1a1a2e',
              }}>
                {leaderboard[0].fullName.charAt(0)}
              </Avatar>
              <Typography variant="h6" fontWeight={900} sx={{ color: '#d97706', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                {leaderboard[0].fullName.split(' ')[0]}
              </Typography>
              <Typography variant="h5" fontWeight={900} sx={{ color: '#1a1a2e', fontSize: { xs: '1.2rem', sm: '1.4rem' } }}>
                {leaderboard[0].score}
              </Typography>
              <Typography variant="caption" sx={{ color: '#8888aa', fontSize: '0.7rem' }}>pts</Typography>
            </Box>

            {/* 3rd */}
            <Box sx={{
              flex: '0 1 160px', textAlign: 'center',
              background: 'rgba(180,120,60,0.06)',
              border: '1.5px solid rgba(180,120,60,0.25)',
              borderRadius: '20px', p: { xs: 2, sm: 2.5 },
            }}>
              <Typography sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, mb: 1 }}>🥉</Typography>
              <Avatar sx={{
                width: { xs: 44, sm: 54 }, height: { xs: 44, sm: 54 },
                mx: 'auto', mb: 1, fontSize: { xs: '1rem', sm: '1.2rem' },
                fontWeight: 800, bgcolor: '#b07840', color: 'white',
              }}>
                {leaderboard[2].fullName.charAt(0)}
              </Avatar>
              <Typography fontWeight={700} sx={{ color: '#92400e', fontSize: { xs: '0.8rem', sm: '0.9rem' } }}>
                {leaderboard[2].fullName.split(' ')[0]}
              </Typography>
              <Typography variant="h6" fontWeight={900} sx={{ color: '#1a1a2e', fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                {leaderboard[2].score}
              </Typography>
              <Typography variant="caption" sx={{ color: '#8888aa', fontSize: '0.7rem' }}>pts</Typography>
            </Box>
          </Box>
        )}

        {/* Full Rankings */}
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" fontWeight={700} mb={2} sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
            📋 Full Rankings
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {leaderboard.map((member, index) => {
            const style = getMedalStyle(index);
            return (
              <Box key={member.userId} sx={{
                p: { xs: 1.5, sm: 2 }, mb: 1.5, borderRadius: '14px',
                background: style.bg, border: `1.5px solid ${style.border}`,
                transition: 'all 0.2s', '&:hover': { transform: 'translateX(4px)' }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                  <Typography sx={{
                    fontSize: index < 3 ? { xs: '1.3rem', sm: '1.5rem' } : { xs: '0.85rem', sm: '1rem' },
                    fontWeight: 800, minWidth: { xs: 32, sm: 40 }, textAlign: 'center', color: style.color,
                  }}>
                    {style.medal}
                  </Typography>

                  <Avatar sx={{
                    width: { xs: 34, sm: 40 }, height: { xs: 34, sm: 40 },
                    fontWeight: 800, bgcolor: style.avatarBg,
                    color: index < 3 ? '#1a1a2e' : '#8888aa', fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  }}>
                    {member.fullName.charAt(0)}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography fontWeight={700} sx={{
                      color: '#1a1a2e', fontSize: { xs: '0.85rem', sm: '0.95rem' },
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                      {member.fullName}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <LinearProgress variant="determinate" value={(member.score / maxScore) * 100}
                        sx={{
                          flex: 1, height: { xs: 4, sm: 6 }, borderRadius: '4px',
                          bgcolor: 'rgba(0,0,0,0.06)',
                          '& .MuiLinearProgress-bar': { bgcolor: style.color, borderRadius: '4px' }
                        }}
                      />
                      <Typography variant="caption" fontWeight={800} sx={{ color: style.color, minWidth: { xs: 40, sm: 50 }, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        {member.score} pts
                      </Typography>
                    </Box>
                  </Box>

                  {/* Chips — hidden on xs */}
                  <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.8 }}>
                    <Chip label={`✅ ${member.completedTasks}`} size="small"
                      sx={{ bgcolor: 'rgba(16,185,129,0.08)', color: '#059669', fontWeight: 700, fontSize: '0.7rem' }} />
                    <Chip label={`⚖️ ${member.totalWeightCompleted}`} size="small"
                      sx={{ bgcolor: 'rgba(99,102,241,0.08)', color: '#6366f1', fontWeight: 700, fontSize: '0.7rem' }} />
                    <Chip label={`⚡ ${member.acknowledgeRate}%`} size="small"
                      sx={{ bgcolor: 'rgba(245,158,11,0.08)', color: '#d97706', fontWeight: 700, fontSize: '0.7rem' }} />
                  </Box>
                </Box>

                {/* Mobile stats */}
                <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 0.8, mt: 1, ml: '72px' }}>
                  <Chip label={`✅ ${member.completedTasks}`} size="small"
                    sx={{ bgcolor: 'rgba(16,185,129,0.08)', color: '#059669', fontWeight: 700, fontSize: '0.65rem' }} />
                  <Chip label={`⚖️ ${member.totalWeightCompleted}`} size="small"
                    sx={{ bgcolor: 'rgba(99,102,241,0.08)', color: '#6366f1', fontWeight: 700, fontSize: '0.65rem' }} />
                </Box>

                <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: '#8888aa', minWidth: { xs: 80, sm: 100 }, fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>
                    Completion Rate
                  </Typography>
                  <LinearProgress variant="determinate" value={member.completionRate}
                    sx={{
                      flex: 1, height: { xs: 3, sm: 4 }, borderRadius: '4px',
                      bgcolor: 'rgba(16,185,129,0.1)',
                      '& .MuiLinearProgress-bar': { bgcolor: '#10b981', borderRadius: '4px' }
                    }}
                  />
                  <Typography variant="caption" sx={{ color: '#059669', minWidth: 36, fontSize: { xs: '0.65rem', sm: '0.72rem' }, fontWeight: 700 }}>
                    {member.completionRate}%
                  </Typography>
                </Box>
              </Box>
            );
          })}

          {leaderboard.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontSize: '2.5rem' }}>🏆</Typography>
              <Typography sx={{ color: '#8888aa', mt: 1 }}>No members found</Typography>
            </Box>
          )}
        </Paper>

        {/* Score System */}
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" fontWeight={700} mb={2} sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
            🎯 How Points Work
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(3, 1fr)' }, gap: { xs: 1, sm: 2 } }}>
            {[
              { icon: '✅', label: 'Completed Task', points: '+10 pts', color: '#059669', bg: 'rgba(16,185,129,0.06)' },
              { icon: '⚖️', label: 'Weight Done', points: '×2 pts', color: '#6366f1', bg: 'rgba(99,102,241,0.06)' },
              { icon: '⚡', label: 'Acknowledge Rate', points: '+1 pt/%', color: '#d97706', bg: 'rgba(245,158,11,0.06)' },
            ].map(item => (
              <Box key={item.label} sx={{
                p: { xs: 1.5, sm: 2 }, borderRadius: '14px', textAlign: 'center',
                background: item.bg, border: `1.5px solid ${item.color}20`,
              }}>
                <Typography sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>{item.icon}</Typography>
                <Typography variant="caption" sx={{
                  color: '#4a4a6a', mt: 0.5, display: 'block',
                  fontSize: { xs: '0.65rem', sm: '0.72rem' }, fontWeight: 600,
                }}>
                  {item.label}
                </Typography>
                <Typography fontWeight={900} sx={{ color: item.color, fontSize: { xs: '0.85rem', sm: '1rem' } }}>
                  {item.points}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default LeaderboardPage;