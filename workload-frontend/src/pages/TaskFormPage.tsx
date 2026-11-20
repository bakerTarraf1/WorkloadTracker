import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, MenuItem,
  Paper, Select, FormControl, InputLabel,
  CircularProgress, Alert, Divider, Chip
} from '@mui/material';
import { createTask, updateTask, getTaskById, suggestAssignee } from '../api/tasks';
import { getAllUsers } from '../api/users';
import { User } from '../types';
import Navbar from '../components/Navbar';

const priorityLabels: Record<number, string> = { 0: 'Low', 1: 'Medium', 2: 'High', 3: 'Critical' };
const complexityLabels: Record<number, string> = { 0: 'Simple', 1: 'Medium', 2: 'Complex' };

const TaskFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    title: '', description: '', assignedUserId: '',
    priority: 0, complexity: 0, effortHours: 1,
    startDate: '', dueDate: ''
  });

  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [memberData, setMemberData] = useState<any[]>([]);
  const [suggestionError, setSuggestionError] = useState('');

  useEffect(() => {
    getAllUsers().then(setUsers);
    if (isEdit) {
      getTaskById(Number(id)).then(data => {
        setForm({
          title: data.title,
          description: data.description,
          assignedUserId: data.assignedUserId,
          priority: data.priority,
          complexity: data.complexity,
          effortHours: data.effortHours,
          startDate: data.startDate.split('T')[0],
          dueDate: data.dueDate.split('T')[0]
        });
      });
    }
  }, [id]);

  const handleSubmit = async () => {
    try {
      if (isEdit) await updateTask(Number(id), form);
      else await createTask(form);
      navigate('/');
    } catch {
      alert('Failed to save task');
    }
  };

  const handleAISuggest = async () => {
    if (!form.title) { setSuggestionError('Please enter a task title first'); return; }
    setSuggesting(true);
    setSuggestion(null);
    setSuggestionError('');
    try {
      const data = await suggestAssignee({
        taskTitle: form.title,
        taskDescription: form.description,
        priority: priorityLabels[form.priority],
        complexity: complexityLabels[form.complexity],
        effortHours: form.effortHours
      });
      setSuggestion(data.suggestion);
      setMemberData(data.memberData || []);
    } catch {
      setSuggestionError('AI suggestion failed. Please try again.');
    } finally {
      setSuggesting(false);
    }
  };

  const applySuggestion = (userId: string) => {
    setForm(prev => ({ ...prev, assignedUserId: userId }));
    setSuggestion(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return '#059669';
      case 'Moderate': return '#d97706';
      case 'Overloaded': return '#dc2626';
      default: return '#8888aa';
    }
  };

  return (
    <>
      <Navbar />
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 700, mx: 'auto' }}>

        <Button
          onClick={() => navigate(-1)}
          sx={{ mb: 2, color: '#8888aa', fontSize: { xs: '0.8rem', sm: '0.875rem' },
            '&:hover': { color: '#6366f1', background: 'rgba(99,102,241,0.06)' } }}
        >
          ← Back
        </Button>

        <Typography variant="h5" fontWeight={800} mb={3} sx={{
          fontSize: { xs: '1.2rem', sm: '1.4rem' },
          background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          {isEdit ? '✏️ Edit Task' : '📋 Create New Task'}
        </Typography>

        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" fontWeight={700} mb={2} sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
            Task Details
          </Typography>

          <TextField fullWidth label="Title"
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
            sx={{ mb: 2 }} />

          <TextField fullWidth label="Description" multiline rows={3}
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            sx={{ mb: 2 }} />

          {/* Priority & Complexity */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select value={form.priority} label="Priority"
                onChange={e => setForm({ ...form, priority: Number(e.target.value) })}>
                <MenuItem value={0}>🟢 Low</MenuItem>
                <MenuItem value={1}>🔵 Medium</MenuItem>
                <MenuItem value={2}>🟡 High</MenuItem>
                <MenuItem value={3}>🔴 Critical</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Complexity</InputLabel>
              <Select value={form.complexity} label="Complexity"
                onChange={e => setForm({ ...form, complexity: Number(e.target.value) })}>
                <MenuItem value={0}>Simple</MenuItem>
                <MenuItem value={1}>Medium</MenuItem>
                <MenuItem value={2}>Complex</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <TextField fullWidth label="Effort Hours" type="number"
            value={form.effortHours} onChange={e => setForm({ ...form, effortHours: Number(e.target.value) })}
            sx={{ mb: 2 }} />

          {/* Dates */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField fullWidth label="Start Date" type="date"
              InputLabelProps={{ shrink: true }}
              value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            <TextField fullWidth label="Due Date" type="date"
              InputLabelProps={{ shrink: true }}
              value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* AI Smart Assigner */}
          <Box sx={{
            p: { xs: 2, sm: 2.5 }, borderRadius: '14px', mb: 3,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.04), rgba(236,72,153,0.03))',
            border: '1.5px solid rgba(99,102,241,0.15)',
          }}>
            <Box sx={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1.5, sm: 0 }, mb: 1
            }}>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  🧠 AI Smart Assigner
                </Typography>
                <Typography variant="caption" sx={{ color: '#8888aa', fontSize: '0.75rem' }}>
                  AI analyzes workload & suggests the best member
                </Typography>
              </Box>
              <Button
                variant="outlined"
                onClick={handleAISuggest}
                disabled={suggesting || !form.title}
                size="small"
                sx={{
                  borderRadius: '10px',
                  borderColor: '#6366f1', color: '#6366f1',
                  fontSize: { xs: '0.75rem', sm: '0.8rem' },
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: 'rgba(99,102,241,0.08)', borderColor: '#6366f1' }
                }}
              >
                {suggesting ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={14} color="inherit" />
                    <span>Analyzing...</span>
                  </Box>
                ) : '🧠 Suggest'}
              </Button>
            </Box>

            {suggestionError && (
              <Alert severity="error" sx={{ mt: 1.5, borderRadius: '10px', fontSize: '0.8rem' }}>
                {suggestionError}
              </Alert>
            )}

            {suggestion && (
              <Box sx={{ mt: 2 }}>
                {suggestion.warning && (
                  <Alert severity="warning" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.8rem' }}>
                    ⚠️ {suggestion.warning}
                  </Alert>
                )}

                {/* Best Match */}
                <Box sx={{
                  p: { xs: 1.5, sm: 2 }, borderRadius: '12px', mb: 1.5,
                  background: 'rgba(16,185,129,0.06)',
                  border: '1.5px solid rgba(16,185,129,0.2)',
                }}>
                  <Box sx={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 0 }, mb: 1
                  }}>
                    <Typography fontWeight={700} sx={{ color: '#059669', fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                      ✅ Best: {suggestion.suggestedName}
                    </Typography>
                    <Button size="small" variant="contained"
                      onClick={() => applySuggestion(suggestion.suggestedUserId)}
                      sx={{
                        bgcolor: '#10b981', borderRadius: '8px',
                        fontSize: '0.75rem',
                        '&:hover': { bgcolor: '#059669' }
                      }}>
                      Assign ✓
                    </Button>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#4a4a6a', fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
                    {suggestion.reason}
                  </Typography>
                </Box>

                {/* Alternative */}
                {suggestion.alternativeName && (
                  <Box sx={{
                    p: { xs: 1.5, sm: 2 }, borderRadius: '12px', mb: 1.5,
                    background: 'rgba(99,102,241,0.04)',
                    border: '1.5px solid rgba(99,102,241,0.15)',
                  }}>
                    <Box sx={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', flexWrap: 'wrap', gap: 1
                    }}>
                      <Typography fontWeight={600} sx={{ color: '#6366f1', fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                        🔵 Alt: {suggestion.alternativeName}
                      </Typography>
                      <Button size="small" variant="outlined"
                        onClick={() => applySuggestion(suggestion.alternativeUserId)}
                        sx={{ borderRadius: '8px', borderColor: '#6366f1', color: '#6366f1', fontSize: '0.75rem' }}>
                        Assign
                      </Button>
                    </Box>
                  </Box>
                )}

                {/* Team Overview */}
                {memberData.length > 0 && (
                  <Box>
                    <Typography variant="caption" sx={{ color: '#8888aa', display: 'block', mb: 1, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      Team Workload:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                      {memberData.map((m: any) => (
                        <Chip key={m.id}
                          label={`${m.name}: ${m.currentWeight}`}
                          size="small"
                          sx={{
                            bgcolor: `${getStatusColor(m.workloadStatus)}12`,
                            color: getStatusColor(m.workloadStatus),
                            border: `1px solid ${getStatusColor(m.workloadStatus)}30`,
                            fontWeight: 700, fontSize: '0.68rem',
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>

          {/* Assign To */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Assigned To</InputLabel>
            <Select value={form.assignedUserId} label="Assigned To"
              onChange={e => setForm({ ...form, assignedUserId: e.target.value })}>
              {users.map(u => (
                <MenuItem key={u.id} value={u.id}>{u.fullName}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button fullWidth variant="contained" size="large" onClick={handleSubmit}
              sx={{ py: { xs: 1.3, sm: 1.5 }, borderRadius: '12px', fontWeight: 700, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              {isEdit ? '✏️ Update Task' : '🚀 Create Task'}
            </Button>
            <Button fullWidth variant="outlined" size="large" onClick={() => navigate('/')}
              sx={{ py: { xs: 1.3, sm: 1.5 }, borderRadius: '12px', borderColor: '#e8e8f0', color: '#8888aa', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Cancel
            </Button>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default TaskFormPage;