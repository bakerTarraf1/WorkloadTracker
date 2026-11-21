import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Chip, Button,
  Divider, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, TextField, CircularProgress
} from '@mui/material';
import { getTaskById, updateTaskStatus, acknowledgeTask } from '../api/tasks';
import { getAllUsers } from '../api/users';
import { createChangeRequest } from '../api/changeRequests';
import { TaskItem } from '../types';
import { getPriorityLabel, getComplexityLabel, getStatusLabel } from '../utils/workload';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const TaskDetailPage = () => {
  const { id } = useParams();
  const [task, setTask] = useState<TaskItem | null>(null);
  const [newStatus, setNewStatus] = useState<number>(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [crType, setCrType] = useState(1); // ← default = ChangeDueDate
  const [crValue, setCrValue] = useState('');
  const [crSuccess, setCrSuccess] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const loadTask = useCallback(async () => {
    try {
      setError('');
      setLoading(true);
      const data = await getTaskById(Number(id));
      setTask(data);
      setNewStatus(data.status);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) setError('You do not have permission to view this task');
      else if (status === 404) setError('Task not found');
      else setError('Failed to load task. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTask();
    getAllUsers().then(setUsers);
  }, [loadTask]);

  const handleStatusUpdate = async () => {
    if (!user || !task) return;
    try {
      setError('');
      await updateTaskStatus(Number(id), newStatus, user.userId);
      await loadTask();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) setError('You can only update status of your own tasks');
      else setError('Failed to update status');
    }
  };

  const handleAcknowledge = async () => {
    if (!task) return;
    try {
      setError('');
      await acknowledgeTask(Number(id));
      await loadTask();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) setError('You can only acknowledge your own tasks');
      else setError('Failed to acknowledge task');
    }
  };

  const handleCreateCR = async () => {
    if (!user || !task) return;

    // ✅ تحقق إن الـ Value مش فاضي
    if (!crValue) {
      setError('Please fill in the required field');
      return;
    }

    try {
      setError('');
      await createChangeRequest({
        taskItemId: task.id,
        requestedByUserId: user.userId,
        type: crType,
        newValue: crValue
      });
      setCrSuccess('Request sent successfully!');
      setOpenDialog(false);
      setCrValue('');
      setCrType(1);
      await loadTask();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 403) setError('You can only request changes for your own tasks');
      else setError('Failed to send request');
    }
  };

  // ===== Loading =====
  if (loading) return (
    <>
      <Navbar />
      <Box sx={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', gap: 2
      }}>
        <CircularProgress sx={{ color: '#6366f1' }} />
        <Typography sx={{ color: '#8888aa', fontSize: '0.875rem' }}>
          Loading task...
        </Typography>
      </Box>
    </>
  );

  // ===== Error =====
  if (error && !task) return (
    <>
      <Navbar />
      <Box sx={{
        p: 3, maxWidth: 600, mx: 'auto',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', mt: 5, gap: 2
      }}>
        <Typography sx={{ fontSize: '3rem' }}>⚠️</Typography>
        <Alert severity="error" sx={{ width: '100%', borderRadius: '12px' }}>{error}</Alert>
        <Button variant="outlined" onClick={() => navigate(-1)}
          sx={{ borderRadius: '12px', borderColor: '#e8e8f0', color: '#8888aa', mt: 1 }}>
          ← Go Back
        </Button>
      </Box>
    </>
  );

  if (!task) return null;

  const isOwner = user?.userId === task.assignedUserId;
  const isAdminOrLeader = user?.role === 'Admin' || user?.role === 'TeamLeader';

  const getPriorityColor = (p: number) => {
    const colors = ['#059669', '#d97706', '#ea580c', '#dc2626'];
    return colors[p] || '#8888aa';
  };

  const getStatusColor = (s: number) => {
    const colors = ['#6366f1', '#3b82f6', '#ef4444', '#10b981'];
    return colors[s] || '#8888aa';
  };

  // ✅ Labels تطابق الـ Enum
  const getCRTypeLabel = (type: number) => {
    switch (type) {
      case 0: return '👤 Reassign';
      case 1: return '📅 Deadline';
      case 2: return '⚡ Effort';
      default: return 'Unknown';
    }
  };

  return (
    <>
      <Navbar />
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, mx: 'auto' }}>
        <Button onClick={() => navigate(-1)} sx={{
          mb: 2, color: '#8888aa', fontSize: { xs: '0.8rem', sm: '0.875rem' },
          '&:hover': { color: '#6366f1', background: 'rgba(99,102,241,0.06)' }
        }}>
          ← Back
        </Button>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}
        {crSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>{crSuccess}</Alert>}

        {/* Task Header */}
        <Paper sx={{ p: { xs: 2.5, sm: 3 }, mb: 2.5 }}>
          <Box sx={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 2
          }}>
            <Typography variant="h5" fontWeight={800} sx={{
              fontSize: { xs: '1.2rem', sm: '1.4rem' }, color: '#1a1a2e', flex: 1
            }}>
              {task.title}
            </Typography>
            <Chip label={getStatusLabel(task.status)} sx={{
              bgcolor: `${getStatusColor(task.status)}15`,
              color: getStatusColor(task.status),
              border: `1.5px solid ${getStatusColor(task.status)}30`,
              fontWeight: 700, fontSize: '0.78rem',
            }} />
          </Box>

          <Typography sx={{
            color: '#4a4a6a', mb: 2.5,
            fontSize: { xs: '0.875rem', sm: '0.95rem' }, lineHeight: 1.7
          }}>
            {task.description}
          </Typography>

          <Divider sx={{ mb: 2.5 }} />

          {/* Info Grid */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: { xs: 1.5, sm: 2 }, mb: 2.5
          }}>
            {[
              { label: 'Assigned To', value: task.assignedUser, color: '#6366f1' },
              { label: 'Priority', value: getPriorityLabel(task.priority), color: getPriorityColor(task.priority) },
              { label: 'Complexity', value: getComplexityLabel(task.complexity), color: '#8888aa' },
              { label: 'Effort Hours', value: `${task.effortHours} hrs`, color: '#1a1a2e' },
              { label: 'Start Date', value: new Date(task.startDate).toLocaleDateString(), color: '#1a1a2e' },
              { label: 'Due Date', value: new Date(task.dueDate).toLocaleDateString(), color: '#dc2626' },
            ].map(info => (
              <Box key={info.label} sx={{
                p: { xs: 1.5, sm: 2 },
                background: 'rgba(99,102,241,0.03)',
                border: '1.5px solid #e8e8f0', borderRadius: '12px',
              }}>
                <Typography variant="caption" sx={{
                  color: '#8888aa', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.06em', fontSize: '0.65rem', display: 'block', mb: 0.5
                }}>
                  {info.label}
                </Typography>
                <Typography fontWeight={700} sx={{
                  color: info.color, fontSize: { xs: '0.875rem', sm: '0.95rem' }
                }}>
                  {info.value}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Weight */}
          <Box sx={{
            p: { xs: 1.5, sm: 2 },
            background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(236,72,153,0.04))',
            border: '1.5px solid rgba(99,102,241,0.15)',
            borderRadius: '12px', mb: 2.5,
          }}>
            <Typography variant="caption" sx={{
              color: '#6366f1', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.65rem'
            }}>
              ⚖️ Task Weight
            </Typography>
            <Typography variant="h4" fontWeight={900} sx={{
              color: '#6366f1', mt: 0.5, fontSize: { xs: '1.8rem', sm: '2.2rem' }
            }}>
              {task.weight?.toFixed(1)}
            </Typography>
            <Typography variant="caption" sx={{ color: '#8888aa' }}>
              Effort × Complexity × Priority
            </Typography>
          </Box>

          {/* Acknowledge — صاحب المهمة فقط */}
          {isOwner && (
            <>
              {!task.isAcknowledged ? (
                <Button fullWidth variant="contained" onClick={handleAcknowledge}
                  sx={{ py: { xs: 1.2, sm: 1.5 }, borderRadius: '12px', fontWeight: 700 }}>
                  ✅ Acknowledge Task
                </Button>
              ) : (
                <Box sx={{
                  p: 2, textAlign: 'center',
                  background: 'rgba(16,185,129,0.06)',
                  border: '1.5px solid rgba(16,185,129,0.2)', borderRadius: '12px',
                }}>
                  <Typography fontWeight={700} sx={{ color: '#059669', fontSize: { xs: '0.82rem', sm: '0.95rem' } }}>
                    ✅ Acknowledged — {new Date(task.acknowledgedAt!).toLocaleString()}
                  </Typography>
                </Box>
              )}
            </>
          )}

          {/* Admin/Leader — عرض الـ Acknowledge فقط */}
          {isAdminOrLeader && (
            <Box sx={{
              p: 2, textAlign: 'center', mt: 1,
              background: task.isAcknowledged ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
              border: `1.5px solid ${task.isAcknowledged ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
              borderRadius: '12px',
            }}>
              <Typography fontWeight={700} sx={{
                color: task.isAcknowledged ? '#059669' : '#d97706',
                fontSize: { xs: '0.82rem', sm: '0.95rem' }
              }}>
                {task.isAcknowledged
                  ? `✅ Acknowledged — ${new Date(task.acknowledgedAt!).toLocaleString()}`
                  : '⏳ Not acknowledged yet'}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Update Status — صاحب المهمة أو Admin/Leader */}
        {(isOwner || isAdminOrLeader) && (
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2.5 }}>
            <Typography variant="h6" fontWeight={700} mb={2}
              sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
              🔄 Update Status
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl sx={{ flex: 1, minWidth: { xs: '100%', sm: 200 } }}>
                <InputLabel>Status</InputLabel>
                <Select value={newStatus} label="Status"
                  onChange={e => setNewStatus(Number(e.target.value))}>
                  <MenuItem value={0}>🆕 New</MenuItem>
                  <MenuItem value={1}>⚡ In Progress</MenuItem>
                  <MenuItem value={2}>🚫 Blocked</MenuItem>
                  <MenuItem value={3}>✅ Done</MenuItem>
                </Select>
              </FormControl>
              <Button variant="contained" onClick={handleStatusUpdate}
                sx={{
                  px: 3, borderRadius: '12px',
                  minWidth: { xs: '100%', sm: 'auto' },
                  py: { xs: 1.2, sm: 'auto' },
                }}>
                Update
              </Button>
            </Box>
          </Paper>
        )}

        {/* Change Request — صاحب المهمة فقط */}
        {isOwner && (
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2.5 }}>
            <Box sx={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1
            }}>
              <Box>
                <Typography variant="h6" fontWeight={700}
                  sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
                  📝 Change Requests
                </Typography>
                <Typography variant="caption" sx={{ color: '#8888aa' }}>
                  Request deadline extension, effort change, or reassignment
                </Typography>
              </Box>
              <Button variant="outlined"
                onClick={() => { setCrType(1); setCrValue(''); setOpenDialog(true); }}
                sx={{ borderRadius: '12px', borderColor: '#e8e8f0', color: '#6366f1' }}>
                + Request Change
              </Button>
            </Box>

            {task.changeRequests && task.changeRequests.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="caption" sx={{
                  color: '#8888aa', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1
                }}>
                  Request History
                </Typography>
                {task.changeRequests.map((cr: any) => (
                  <Box key={cr.id} sx={{
                    mb: 1.5, p: { xs: 1.5, sm: 2 },
                    background: 'rgba(99,102,241,0.03)',
                    border: '1.5px solid #e8e8f0', borderRadius: '12px',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap', gap: 1
                  }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600}
                        sx={{ color: '#1a1a2e', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                        {getCRTypeLabel(cr.type)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8888aa' }}>
                        {cr.newValue}
                      </Typography>
                    </Box>
                    <Chip
                      label={cr.status === 0 ? 'Pending' : cr.status === 1 ? 'Approved' : 'Rejected'}
                      size="small"
                      sx={{
                        bgcolor: cr.status === 1 ? 'rgba(16,185,129,0.1)'
                          : cr.status === 2 ? 'rgba(239,68,68,0.1)'
                          : 'rgba(245,158,11,0.1)',
                        color: cr.status === 1 ? '#059669'
                          : cr.status === 2 ? '#dc2626'
                          : '#d97706',
                        fontWeight: 700, fontSize: '0.7rem',
                      }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        )}

        {/* Admin/Leader — Change Request History */}
        {isAdminOrLeader && task.changeRequests && task.changeRequests.length > 0 && (
          <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2.5 }}>
            <Typography variant="h6" fontWeight={700} mb={2}
              sx={{ fontSize: { xs: '1rem', sm: '1.1rem' } }}>
              📝 Change Request History
            </Typography>
            {task.changeRequests.map((cr: any) => (
              <Box key={cr.id} sx={{
                mb: 1.5, p: { xs: 1.5, sm: 2 },
                background: 'rgba(99,102,241,0.03)',
                border: '1.5px solid #e8e8f0', borderRadius: '12px',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', flexWrap: 'wrap', gap: 1
              }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}
                    sx={{ color: '#1a1a2e', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    {getCRTypeLabel(cr.type)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8888aa' }}>
                    {cr.newValue}
                  </Typography>
                </Box>
                <Chip
                  label={cr.status === 0 ? 'Pending' : cr.status === 1 ? 'Approved' : 'Rejected'}
                  size="small"
                  sx={{
                    bgcolor: cr.status === 1 ? 'rgba(16,185,129,0.1)'
                      : cr.status === 2 ? 'rgba(239,68,68,0.1)'
                      : 'rgba(245,158,11,0.1)',
                    color: cr.status === 1 ? '#059669'
                      : cr.status === 2 ? '#dc2626'
                      : '#d97706',
                    fontWeight: 700, fontSize: '0.7rem',
                  }}
                />
              </Box>
            ))}
          </Paper>
        )}

        {/* Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}
          fullWidth maxWidth="sm"
          PaperProps={{ sx: { borderRadius: '20px', m: { xs: 1, sm: 2 } } }}>
          <DialogTitle sx={{ fontWeight: 700, color: '#1a1a2e', pb: 1 }}>
            📝 Request Change
          </DialogTitle>
          <DialogContent>

            {/* ✅ الترتيب يطابق الـ Enum تماماً */}
            <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
              <InputLabel>Change Type</InputLabel>
              <Select value={crType} label="Change Type"
                onChange={e => { setCrType(Number(e.target.value)); setCrValue(''); }}>
                {/* ChangeOwner = 0 */}
                <MenuItem value={0}>👤 Reassign Task</MenuItem>
                {/* ChangeDueDate = 1 */}
                <MenuItem value={1}>📅 Extend Deadline</MenuItem>
                {/* IncreaseEffort = 2 */}
                <MenuItem value={2}>⚡ Increase Effort Hours</MenuItem>
              </Select>
            </FormControl>

            {/* ✅ Input حسب النوع */}
            {crType === 0 && (
              // Reassign — اختر User من القائمة
              <FormControl fullWidth>
                <InputLabel>Assign To</InputLabel>
                <Select value={crValue} label="Assign To"
                  onChange={e => setCrValue(e.target.value)}>
                  {users.map((u: any) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {crType === 1 && (
              // ChangeDueDate — Date Picker
              <TextField fullWidth label="New Deadline" type="date"
                InputLabelProps={{ shrink: true }}
                value={crValue}
                onChange={e => setCrValue(e.target.value)}
              />
            )}

            {crType === 2 && (
              // IncreaseEffort — Number
              <TextField fullWidth label="New Effort Hours" type="number"
                value={crValue}
                onChange={e => setCrValue(e.target.value)}
                inputProps={{ min: 1, max: 100 }}
              />
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 0, gap: 1 }}>
            <Button onClick={() => setOpenDialog(false)} sx={{ color: '#8888aa' }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCreateCR}
              disabled={!crValue}
              sx={{ borderRadius: '10px' }}>
              Send Request
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default TaskDetailPage;