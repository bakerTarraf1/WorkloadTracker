import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Chip, Button, Card, CardContent
} from '@mui/material';
import { getAllTasks } from '../api/tasks';
import { TaskItem } from '../types';
import { getPriorityLabel, getComplexityLabel, getStatusLabel } from '../utils/workload';
import Navbar from '../components/Navbar';

const MemberDetailPage = () => {
  const { userId } = useParams();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAllTasks().then(data => {
      setTasks(data.filter((t: TaskItem) => t.assignedUserId === userId));
    });
  }, [userId]);

  const memberName = tasks[0]?.assignedUser || 'Member';

  const getStatusStyle = (status: number) => {
    const styles: any = {
      0: { bg: 'rgba(99,102,241,0.08)', color: '#6366f1', border: 'rgba(99,102,241,0.2)' },
      1: { bg: 'rgba(59,130,246,0.08)', color: '#3b82f6', border: 'rgba(59,130,246,0.2)' },
      2: { bg: 'rgba(239,68,68,0.08)', color: '#dc2626', border: 'rgba(239,68,68,0.2)' },
      3: { bg: 'rgba(16,185,129,0.08)', color: '#059669', border: 'rgba(16,185,129,0.2)' },
    };
    return styles[status] || styles[0];
  };

  const getPriorityStyle = (priority: number) => {
    const styles: any = {
      0: { color: '#059669' },
      1: { color: '#3b82f6' },
      2: { color: '#d97706' },
      3: { color: '#dc2626' },
    };
    return styles[priority] || styles[0];
  };

  return (
    <>
      <Navbar />
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1100, mx: 'auto' }}>
        <Button onClick={() => navigate('/')} sx={{
          mb: 2, color: '#8888aa', fontSize: { xs: '0.8rem', sm: '0.875rem' },
          '&:hover': { color: '#6366f1', background: 'rgba(99,102,241,0.06)' }
        }}>
          ← Back
        </Button>

        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" fontWeight={800} sx={{
            fontSize: { xs: '1.3rem', sm: '1.5rem' },
            background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            {memberName}'s Tasks
          </Typography>
          <Typography variant="body2" sx={{ color: '#8888aa', mt: 0.5 }}>
            {tasks.length} tasks total
          </Typography>
        </Box>

        {/* Mobile Cards */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
          {tasks.map(task => {
            const statusStyle = getStatusStyle(task.status);
            const priorityStyle = getPriorityStyle(task.priority);
            return (
              <Card key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                sx={{
                  borderRadius: '16px', cursor: 'pointer',
                  border: '1.5px solid #e8e8f0',
                  transition: 'all 0.2s',
                  '&:hover': { border: '1.5px solid rgba(99,102,241,0.3)', transform: 'translateY(-2px)' }
                }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'flex-start' }}>
                    <Typography fontWeight={700} sx={{ color: '#1a1a2e', fontSize: '0.9rem', flex: 1, mr: 1 }}>
                      {task.title}
                    </Typography>
                    <Chip label={getStatusLabel(task.status)} size="small" sx={{
                      bgcolor: statusStyle.bg, color: statusStyle.color,
                      border: `1px solid ${statusStyle.border}`, fontWeight: 700, fontSize: '0.65rem', flexShrink: 0,
                    }} />
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 1.5 }}>
                    {[
                      { label: 'Priority', value: getPriorityLabel(task.priority), color: priorityStyle.color },
                      { label: 'Complexity', value: getComplexityLabel(task.complexity), color: '#4a4a6a' },
                      { label: 'Effort', value: `${task.effortHours} hrs`, color: '#4a4a6a' },
                      { label: 'Weight', value: task.weight.toFixed(1), color: '#6366f1' },
                    ].map(info => (
                      <Box key={info.label} sx={{ p: 1, background: 'rgba(99,102,241,0.03)', borderRadius: '8px', border: '1px solid #e8e8f0' }}>
                        <Typography variant="caption" sx={{ color: '#8888aa', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                          {info.label}
                        </Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ color: info.color }}>
                          {info.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#8888aa' }}>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </Typography>
                    <Chip
                      label={task.isAcknowledged ? '✅ Acknowledged' : '⏳ Pending'}
                      size="small"
                      sx={{
                        bgcolor: task.isAcknowledged ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                        color: task.isAcknowledged ? '#059669' : '#d97706',
                        border: `1px solid ${task.isAcknowledged ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                        fontWeight: 700, fontSize: '0.65rem',
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Desktop Table */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f4f4f8' }}>
                  {['Title', 'Priority', 'Complexity', 'Effort', 'Weight', 'Status', 'Due Date', 'Acknowledged'].map(h => (
                    <th key={h} style={{
                      padding: '14px 20px', textAlign: 'left', color: '#8888aa',
                      fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.08em', borderBottom: '2px solid #e8e8f0',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => {
                  const statusStyle = getStatusStyle(task.status);
                  return (
                    <tr key={task.id}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      style={{ cursor: 'pointer', borderBottom: '1px solid #e8e8f0', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#1a1a2e' }}>{task.title}</td>
                      <td style={{ padding: '14px 20px', color: getPriorityStyle(task.priority).color, fontWeight: 600 }}>{getPriorityLabel(task.priority)}</td>
                      <td style={{ padding: '14px 20px', color: '#4a4a6a' }}>{getComplexityLabel(task.complexity)}</td>
                      <td style={{ padding: '14px 20px', color: '#4a4a6a' }}>{task.effortHours}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 700, color: '#6366f1' }}>{task.weight.toFixed(1)}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <Chip label={getStatusLabel(task.status)} size="small" sx={{
                          bgcolor: statusStyle.bg, color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`, fontWeight: 700,
                        }} />
                      </td>
                      <td style={{ padding: '14px 20px', color: '#4a4a6a' }}>{new Date(task.dueDate).toLocaleDateString()}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <Chip
                          label={task.isAcknowledged ? 'Yes' : 'No'}
                          size="small"
                          sx={{
                            bgcolor: task.isAcknowledged ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                            color: task.isAcknowledged ? '#059669' : '#d97706',
                            border: `1px solid ${task.isAcknowledged ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                            fontWeight: 700,
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        </Paper>

        {tasks.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8, background: '#fff', borderRadius: '20px', border: '1.5px dashed #e8e8f0' }}>
            <Typography sx={{ fontSize: '3rem' }}>📋</Typography>
            <Typography fontWeight={600} sx={{ color: '#4a4a6a', mt: 1 }}>No tasks assigned</Typography>
          </Box>
        )}
      </Box>
    </>
  );
};

export default MemberDetailPage;