import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button,
  Chip, CircularProgress, Alert, Divider,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getAllUsers } from '../api/users';
import { createTask } from '../api/tasks';
import Navbar from '../components/Navbar';
import api from '../api/axios';

interface SuggestedTask {
  title: string; description: string;
  priority: number; complexity: number;
  effortHours: number; selected: boolean;
}

const AITaskGeneratorPage = () => {
  const [prompt, setPrompt] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<SuggestedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getAllUsers().then(setUsers);
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    setStartDate(today); setDueDate(nextWeek);
  }, []);

  const generateTasks = async () => {
    if (!prompt.trim()) { setError('Please describe your project'); return; }
    setLoading(true); setError(''); setTasks([]);
    try {
      const res = await api.post('/ai/generate-tasks', { prompt });
      const text = res.data.result || '';
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('Invalid');
      setTasks(JSON.parse(match[0]).map((t: any) => ({ ...t, selected: true })));
    } catch { setError('Failed to generate tasks.'); }
    finally { setLoading(false); }
  };

  const createAllTasks = async () => {
    if (!assignedUserId) { setError('Please select a member'); return; }
    const selected = tasks.filter(t => t.selected);
    if (!selected.length) { setError('Select at least one task'); return; }
    setCreating(true); setError('');
    try {
      for (const task of selected) {
        await createTask({ title: task.title, description: task.description, assignedUserId, priority: task.priority, complexity: task.complexity, effortHours: task.effortHours, startDate, dueDate });
      }
      setSuccess(`✅ ${selected.length} tasks created!`);
      setTimeout(() => navigate('/'), 2000);
    } catch { setError('Failed to create tasks'); }
    finally { setCreating(false); }
  };

  return (
    <>
      <Navbar />
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, mx: 'auto' }}>
        <Box sx={{ mb: { xs: 3, sm: 4 }, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={900} sx={{
            fontSize: { xs: '1.5rem', sm: '2rem' },
            background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', mb: 1,
          }}>
            🤖 AI Task Generator
          </Typography>
          <Typography sx={{ color: '#8888aa', fontSize: { xs: '0.82rem', sm: '0.875rem' } }}>
            Describe your project and let AI generate tasks automatically
          </Typography>
        </Box>

        {/* Input */}
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2.5 }}>
          <Typography variant="h6" fontWeight={700} mb={2} sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
            📝 Describe Your Project
          </Typography>
          <TextField fullWidth multiline rows={4}
            placeholder="Build a delivery mobile app with user authentication, order tracking, payment system..."
            value={prompt} onChange={e => setPrompt(e.target.value)} sx={{ mb: 2.5 }} />

          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={{ color: '#8888aa', mb: 1, display: 'block', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.06em' }}>
              Quick Examples:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['Build an e-commerce website', 'Create a mobile banking app', 'Develop a school management system', 'Build a social media platform'].map(ex => (
                <Chip key={ex} label={ex} size="small" onClick={() => setPrompt(ex)}
                  sx={{
                    cursor: 'pointer', fontSize: { xs: '0.68rem', sm: '0.72rem' },
                    bgcolor: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)',
                    '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' }
                  }} />
              ))}
            </Box>
          </Box>

          <Button fullWidth variant="contained" size="large" onClick={generateTasks}
            disabled={loading || !prompt.trim()}
            sx={{ py: { xs: 1.3, sm: 1.5 }, fontSize: { xs: '0.9rem', sm: '1rem' }, fontWeight: 700, borderRadius: '12px' }}>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} color="inherit" />
                <span>AI is thinking...</span>
              </Box>
            ) : '🤖 Generate Tasks with AI'}
          </Button>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.875rem' }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.875rem' }}>{success}</Alert>}

        {/* Generated Tasks */}
        {tasks.length > 0 && (
          <>
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                  ✨ {tasks.length} Tasks Generated
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={() => setTasks(p => p.map(t => ({ ...t, selected: true })))}
                    sx={{ color: '#059669', fontSize: '0.75rem', borderRadius: '8px' }}>All</Button>
                  <Button size="small" onClick={() => setTasks(p => p.map(t => ({ ...t, selected: false })))}
                    sx={{ color: '#8888aa', fontSize: '0.75rem', borderRadius: '8px' }}>None</Button>
                </Box>
              </Box>

              {tasks.map((task, i) => (
                <Box key={i} onClick={() => setTasks(p => p.map((t, j) => j === i ? { ...t, selected: !t.selected } : t))}
                  sx={{
                    mb: { xs: 1.5, sm: 2 }, p: { xs: 1.5, sm: 2 }, borderRadius: '14px', cursor: 'pointer',
                    border: `1.5px solid ${task.selected ? 'rgba(99,102,241,0.3)' : '#e8e8f0'}`,
                    background: task.selected ? 'rgba(99,102,241,0.03)' : '#fafafa',
                    transition: 'all 0.2s', position: 'relative',
                  }}>
                  <Box sx={{
                    position: 'absolute', top: { xs: 12, sm: 14 }, right: { xs: 12, sm: 14 },
                    width: 20, height: 20, borderRadius: '6px',
                    border: `2px solid ${task.selected ? '#6366f1' : '#ccccdd'}`,
                    bgcolor: task.selected ? '#6366f1' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '11px', fontWeight: 800,
                  }}>
                    {task.selected && '✓'}
                  </Box>

                  <Typography fontWeight={700} mb={0.8} pr={4} sx={{ color: '#1a1a2e', fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                    {task.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8888aa', mb: 1.5, fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
                    {task.description}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                    <FormControl size="small" sx={{ minWidth: { xs: 95, sm: 110 } }}>
                      <Select value={task.priority} onChange={e => setTasks(p => p.map((t, j) => j === i ? { ...t, priority: Number(e.target.value) } : t))}>
                        <MenuItem value={0}>🟢 Low</MenuItem>
                        <MenuItem value={1}>🔵 Medium</MenuItem>
                        <MenuItem value={2}>🟡 High</MenuItem>
                        <MenuItem value={3}>🔴 Critical</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: { xs: 95, sm: 110 } }}>
                      <Select value={task.complexity} onChange={e => setTasks(p => p.map((t, j) => j === i ? { ...t, complexity: Number(e.target.value) } : t))}>
                        <MenuItem value={0}>Simple</MenuItem>
                        <MenuItem value={1}>Medium</MenuItem>
                        <MenuItem value={2}>Complex</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField size="small" type="number" label="Hours" value={task.effortHours}
                      onChange={e => setTasks(p => p.map((t, j) => j === i ? { ...t, effortHours: Number(e.target.value) } : t))}
                      sx={{ width: { xs: 70, sm: 80 } }} />
                    <Box sx={{ px: 1.5, py: 0.5, borderRadius: '8px', bgcolor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 800, fontSize: { xs: '0.68rem', sm: '0.72rem' } }}>
                        ⚖️ {(task.effortHours * [1, 1.5, 2][task.complexity] * [1, 1.2, 1.5, 2][task.priority]).toFixed(1)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
            </Paper>

            {/* Assign */}
            <Paper sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" fontWeight={700} mb={2} sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                👤 Assign Tasks
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <FormControl sx={{ flex: { xs: '1 1 100%', sm: '1 1 200px' } }}>
                  <InputLabel>Assign To</InputLabel>
                  <Select value={assignedUserId} label="Assign To" onChange={e => setAssignedUserId(e.target.value)}>
                    {users.map(u => <MenuItem key={u.id} value={u.id}>{u.fullName}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField label="Start Date" type="date" InputLabelProps={{ shrink: true }}
                  value={startDate} onChange={e => setStartDate(e.target.value)}
                  sx={{ flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 150px' } }} />
                <TextField label="Due Date" type="date" InputLabelProps={{ shrink: true }}
                  value={dueDate} onChange={e => setDueDate(e.target.value)}
                  sx={{ flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 150px' } }} />
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#8888aa', fontSize: '0.875rem' }}>
                  {tasks.filter(t => t.selected).length} tasks selected
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button variant="outlined" onClick={() => setTasks([])}
                    sx={{ borderRadius: '12px', borderColor: '#e8e8f0', color: '#8888aa', fontSize: '0.875rem' }}>
                    Clear
                  </Button>
                  <Button variant="contained" size="large" onClick={createAllTasks}
                    disabled={creating || !tasks.filter(t => t.selected).length}
                    sx={{ px: { xs: 2, sm: 3 }, borderRadius: '12px', fontWeight: 700, fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                    {creating ? <CircularProgress size={18} color="inherit" /> : `🚀 Create ${tasks.filter(t => t.selected).length} Tasks`}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </>
        )}
      </Box>
    </>
  );
};

export default AITaskGeneratorPage;