import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Chip, Button, Card, CardContent
} from '@mui/material';
import { getAllChangeRequests, approveChangeRequest, rejectChangeRequest } from '../api/changeRequests';
import { ChangeRequest } from '../types';
import { getChangeRequestTypeLabel } from '../utils/workload';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const ChangeRequestsPage = () => {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const { user } = useAuth();

  const load = () => getAllChangeRequests().then(setRequests);
  useEffect(() => { load(); }, []);

  const handleApprove = async (id: number) => { await approveChangeRequest(id); load(); };
  const handleReject = async (id: number) => { await rejectChangeRequest(id); load(); };

  const getStatusStyle = (status: number) => {
    switch (status) {
      case 0: return { bg: 'rgba(245,158,11,0.08)', color: '#d97706', border: 'rgba(245,158,11,0.2)', label: 'Pending' };
      case 1: return { bg: 'rgba(16,185,129,0.08)', color: '#059669', border: 'rgba(16,185,129,0.2)', label: 'Approved' };
      case 2: return { bg: 'rgba(239,68,68,0.08)', color: '#dc2626', border: 'rgba(239,68,68,0.2)', label: 'Rejected' };
      default: return { bg: 'rgba(99,102,241,0.08)', color: '#6366f1', border: 'rgba(99,102,241,0.2)', label: 'Unknown' };
    }
  };

  return (
    <>
      <Navbar />
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1100, mx: 'auto' }}>
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography variant="h5" fontWeight={800} sx={{
            fontSize: { xs: '1.3rem', sm: '1.5rem' },
            background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            📝 Change Requests
          </Typography>
          <Typography variant="body2" sx={{ color: '#8888aa', mt: 0.5, fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
            {requests.length} total requests
          </Typography>
        </Box>

        {/* Stats */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(3, 1fr)' },
          gap: { xs: 1, sm: 2 }, mb: { xs: 2, sm: 3 }
        }}>
          {[
            { label: 'Pending', value: requests.filter(r => r.status === 0).length, color: '#d97706', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
            { label: 'Approved', value: requests.filter(r => r.status === 1).length, color: '#059669', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
            { label: 'Rejected', value: requests.filter(r => r.status === 2).length, color: '#dc2626', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
          ].map(stat => (
            <Box key={stat.label} sx={{
              background: stat.bg, border: `1.5px solid ${stat.border}`,
              borderRadius: '14px', p: { xs: 1.5, sm: 2 }, textAlign: 'center',
            }}>
              <Typography variant="h4" fontWeight={900} sx={{ color: stat.color, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                {stat.value}
              </Typography>
              <Typography variant="caption" sx={{ color: stat.color, fontWeight: 700, fontSize: { xs: '0.65rem', sm: '0.72rem' } }}>
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Cards for mobile, Table for desktop */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
          {requests.map(r => {
            const statusStyle = getStatusStyle(r.status);
            return (
              <Card key={r.id} sx={{ borderRadius: '16px', border: '1.5px solid #e8e8f0' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography fontWeight={700} sx={{ color: '#1a1a2e', fontSize: '0.9rem', flex: 1, mr: 1 }}>
                      {r.taskTitle}
                    </Typography>
                    <Chip label={statusStyle.label} size="small" sx={{
                      bgcolor: statusStyle.bg, color: statusStyle.color,
                      border: `1px solid ${statusStyle.border}`, fontWeight: 700, fontSize: '0.65rem',
                    }} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                    <Chip label={getChangeRequestTypeLabel(r.type)} size="small"
                      sx={{ bgcolor: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.15)', fontSize: '0.65rem' }} />
                    <Typography variant="caption" sx={{ color: '#8888aa', alignSelf: 'center' }}>
                      {r.newValue}
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#8888aa', display: 'block', mb: 1.5 }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </Typography>
                  {(user?.role === 'Admin' || user?.role === 'TeamLeader') && r.status === 0 && (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="contained" fullWidth
                        onClick={() => handleApprove(r.id)}
                        sx={{ borderRadius: '10px', bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontSize: '0.75rem' }}>
                        ✅ Approve
                      </Button>
                      <Button size="small" variant="outlined" fullWidth
                        onClick={() => handleReject(r.id)}
                        sx={{ borderRadius: '10px', borderColor: '#ef4444', color: '#dc2626', fontSize: '0.75rem' }}>
                        ❌ Reject
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Table for desktop */}
        <Paper sx={{ display: { xs: 'none', md: 'block' }, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f4f4f8' }}>
                  {['Task', 'Type', 'New Value', 'Status', 'Created', ...(user?.role === 'Admin' || user?.role === 'TeamLeader' ? ['Actions'] : [])].map(h => (
                    <th key={h} style={{
                      padding: '14px 20px', textAlign: 'left',
                      color: '#8888aa', fontSize: '0.7rem',
                      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                      borderBottom: '2px solid #e8e8f0',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(r => {
                  const statusStyle = getStatusStyle(r.status);
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #e8e8f0' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#1a1a2e' }}>{r.taskTitle}</td>
                      <td style={{ padding: '14px 20px', color: '#4a4a6a' }}>{getChangeRequestTypeLabel(r.type)}</td>
                      <td style={{ padding: '14px 20px', color: '#4a4a6a', maxWidth: 200 }}>{r.newValue}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <Chip label={statusStyle.label} size="small" sx={{
                          bgcolor: statusStyle.bg, color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`, fontWeight: 700,
                        }} />
                      </td>
                      <td style={{ padding: '14px 20px', color: '#8888aa', fontSize: '0.875rem' }}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                      {(user?.role === 'Admin' || user?.role === 'TeamLeader') && (
                        <td style={{ padding: '14px 20px' }}>
                          {r.status === 0 && (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Button size="small" variant="contained"
                                onClick={() => handleApprove(r.id)}
                                sx={{ borderRadius: '8px', bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, fontSize: '0.75rem' }}>
                                ✅ Approve
                              </Button>
                              <Button size="small" variant="outlined"
                                onClick={() => handleReject(r.id)}
                                sx={{ borderRadius: '8px', borderColor: '#ef4444', color: '#dc2626', fontSize: '0.75rem' }}>
                                ❌ Reject
                              </Button>
                            </Box>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
          {requests.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontSize: '2.5rem' }}>📝</Typography>
              <Typography sx={{ color: '#8888aa', mt: 1 }}>No change requests yet</Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </>
  );
};

export default ChangeRequestsPage;