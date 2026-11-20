import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Chip, Button, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Alert
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAllUsers, changeUserRole, deleteUser, updateUserName } from '../api/users';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [editNameDialog, setEditNameDialog] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (user?.role !== 'Admin') { navigate('/'); return; }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try { const data = await getAllUsers(); setUsers(data); }
    catch { setError('Failed to load users'); }
  };

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(selectedUser.id);
      showSuccess(`✅ ${selectedUser.fullName} deleted`);
      setDeleteDialog(false); loadUsers();
    } catch { setError('Failed to delete'); }
  };

  const handleEditRoleConfirm = async () => {
    try {
      await changeUserRole(selectedUser.id, newRole);
      showSuccess(`✅ Role updated to ${newRole}`);
      setEditDialog(false); loadUsers();
    } catch { setError('Failed to update role'); }
  };

  const handleEditNameConfirm = async () => {
    try {
      await updateUserName(selectedUser.id, newName);
      showSuccess(`✅ Name updated`);
      setEditNameDialog(false); loadUsers();
    } catch { setError('Failed to update name'); }
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'Admin': return { bg: 'rgba(239,68,68,0.08)', color: '#dc2626', border: 'rgba(239,68,68,0.2)' };
      case 'TeamLeader': return { bg: 'rgba(245,158,11,0.08)', color: '#d97706', border: 'rgba(245,158,11,0.2)' };
      default: return { bg: 'rgba(16,185,129,0.08)', color: '#059669', border: 'rgba(16,185,129,0.2)' };
    }
  };

  // ===== Export PDF =====
  const exportUsersPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setFillColor(255, 255, 255);
    doc.circle(20, 16, 8, 'F');
    doc.setTextColor(99, 102, 241);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('W', 17.5, 19);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('WorkloadTracker', 32, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Admin Panel — Users Report', 32, 21);
    doc.text(
      `Generated: ${new Date().toLocaleDateString()} | By: ${user?.fullName}`,
      32, 28
    );

    // Stats Summary
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Users Summary', 14, 44);

    autoTable(doc, {
      startY: 48,
      head: [['Role', 'Count']],
      body: [
        ['Total Users', users.length.toString()],
        ['Admins', users.filter(u => u.role === 'Admin').length.toString()],
        ['Team Leaders', users.filter(u => u.role === 'TeamLeader').length.toString()],
        ['Members', users.filter(u => u.role === 'Member').length.toString()],
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
      },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' },
        1: { cellWidth: 40 },
      },
      margin: { left: 14 },
      tableWidth: 110,
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const label = data.cell.raw as string;
          if (label === 'Admins') data.cell.styles.textColor = [220, 38, 38];
          else if (label === 'Team Leaders') data.cell.styles.textColor = [217, 119, 6];
          else if (label === 'Members') data.cell.styles.textColor = [5, 150, 105];
        }
      },
    });

    // Users List
    const y1 = (doc as any).lastAutoTable.finalY + 12;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Users List', 14, y1);

    autoTable(doc, {
      startY: y1 + 4,
      head: [['#', 'Full Name', 'Email', 'Role']],
      body: users.map((u, i) => [
        (i + 1).toString(),
        u.fullName,
        u.email,
        u.role,
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
      },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [248, 248, 255] },
      didParseCell: (data) => {
        if (data.column.index === 3 && data.section === 'body') {
          const role = data.cell.raw as string;
          if (role === 'Admin') data.cell.styles.textColor = [220, 38, 38];
          else if (role === 'TeamLeader') data.cell.styles.textColor = [217, 119, 6];
          else if (role === 'Member') data.cell.styles.textColor = [5, 150, 105];
        }
      },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(99, 102, 241);
      doc.setLineWidth(0.5);
      doc.line(14, 285, 196, 285);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 170);
      doc.setFont('helvetica', 'normal');
      doc.text('WorkloadTracker — Admin Report', 14, 291);
      doc.text(`Page ${i} of ${pageCount}`, 196, 291, { align: 'right' });
    }

    doc.save(`WorkloadTracker_Users_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <>
      <Navbar />
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1100, mx: 'auto' }}>

        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1.5, sm: 0 },
          mb: 3,
        }}>
          <Typography variant="h5" fontWeight={800} sx={{
            fontSize: { xs: '1.3rem', sm: '1.5rem' },
            background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            👑 Admin Panel
          </Typography>

          <Button
            variant="contained"
            onClick={exportUsersPDF}
            sx={{
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              fontWeight: 700,
              px: { xs: 2.5, sm: 3 },
              py: { xs: 1, sm: 1.2 },
              fontSize: { xs: '0.82rem', sm: '0.875rem' },
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(99,102,241,0.4)',
              },
            }}
          >
            📄 Export PDF
          </Button>
        </Box>

        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

        {/* Stats */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          gap: { xs: 1.5, sm: 2 }, mb: 3
        }}>
          {[
            { label: 'Total', value: users.length, color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)' },
            { label: 'Admins', value: users.filter(u => u.role === 'Admin').length, color: '#dc2626', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
            { label: 'Leaders', value: users.filter(u => u.role === 'TeamLeader').length, color: '#d97706', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
            { label: 'Members', value: users.filter(u => u.role === 'Member').length, color: '#059669', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
          ].map(stat => (
            <Box key={stat.label} sx={{
              background: stat.bg, border: `1.5px solid ${stat.border}`,
              borderRadius: '16px', p: { xs: 1.5, sm: 2.5 }, textAlign: 'center',
            }}>
              <Typography variant="h4" fontWeight={900} sx={{
                color: stat.color, fontSize: { xs: '1.6rem', sm: '2rem' }
              }}>
                {stat.value}
              </Typography>
              <Typography variant="caption" sx={{
                color: stat.color, fontWeight: 700,
                fontSize: { xs: '0.68rem', sm: '0.75rem' }
              }}>
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Mobile Cards */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.5 }}>
          {users.map(u => {
            const roleStyle = getRoleStyle(u.role);
            const isSelf = u.id === user?.userId;
            return (
              <Card key={u.id} sx={{ borderRadius: '16px', border: '1.5px solid #e8e8f0' }}>
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'center' }}>
                    <Box>
                      <Typography fontWeight={700} sx={{ color: '#1a1a2e', fontSize: '0.9rem' }}>
                        {u.fullName}
                        {isSelf && (
                          <Chip label="You" size="small" sx={{
                            ml: 1, bgcolor: 'rgba(99,102,241,0.1)',
                            color: '#6366f1', height: 16, fontSize: '0.6rem'
                          }} />
                        )}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#8888aa' }}>{u.email}</Typography>
                    </Box>
                    <Chip label={u.role} size="small" sx={{
                      bgcolor: roleStyle.bg, color: roleStyle.color,
                      border: `1px solid ${roleStyle.border}`, fontWeight: 700, fontSize: '0.65rem',
                    }} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button size="small" variant="outlined"
                      onClick={() => { setSelectedUser(u); setNewName(u.fullName); setEditNameDialog(true); }}
                      sx={{ borderRadius: '8px', borderColor: '#6366f1', color: '#6366f1', fontSize: '0.72rem', flex: 1 }}>
                      ✏️ Name
                    </Button>
                    {!isSelf && (
                      <Button size="small" variant="outlined"
                        onClick={() => { setSelectedUser(u); setNewRole(u.role); setEditDialog(true); }}
                        sx={{ borderRadius: '8px', borderColor: '#f59e0b', color: '#d97706', fontSize: '0.72rem', flex: 1 }}>
                        🔄 Role
                      </Button>
                    )}
                    {!isSelf && (
                      <Button size="small" variant="outlined"
                        onClick={() => { setSelectedUser(u); setDeleteDialog(true); }}
                        sx={{ borderRadius: '8px', borderColor: '#ef4444', color: '#dc2626', fontSize: '0.72rem', flex: 1 }}>
                        🗑️ Delete
                      </Button>
                    )}
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
                  {['Name', 'Email', 'Role', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '14px 20px', textAlign: 'left',
                      color: '#8888aa', fontSize: '0.7rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.08em',
                      borderBottom: '2px solid #e8e8f0'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const roleStyle = getRoleStyle(u.role);
                  const isSelf = u.id === user?.userId;
                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #e8e8f0' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600, color: '#1a1a2e' }}>
                        {u.fullName}
                        {isSelf && (
                          <span style={{
                            marginLeft: 8, background: 'rgba(99,102,241,0.1)',
                            color: '#6366f1', padding: '2px 8px',
                            borderRadius: 4, fontSize: '0.65rem', fontWeight: 700
                          }}>You</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#8888aa', fontSize: '0.875rem' }}>
                        {u.email}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <Chip label={u.role} size="small" sx={{
                          bgcolor: roleStyle.bg, color: roleStyle.color,
                          border: `1px solid ${roleStyle.border}`, fontWeight: 700
                        }} />
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" variant="outlined"
                            onClick={() => { setSelectedUser(u); setNewName(u.fullName); setEditNameDialog(true); }}
                            sx={{ borderRadius: '8px', borderColor: '#6366f1', color: '#6366f1', fontSize: '0.72rem' }}>
                            ✏️ Name
                          </Button>
                          {!isSelf && (
                            <Button size="small" variant="outlined"
                              onClick={() => { setSelectedUser(u); setNewRole(u.role); setEditDialog(true); }}
                              sx={{ borderRadius: '8px', borderColor: '#f59e0b', color: '#d97706', fontSize: '0.72rem' }}>
                              🔄 Role
                            </Button>
                          )}
                          {!isSelf && (
                            <Button size="small" variant="outlined"
                              onClick={() => { setSelectedUser(u); setDeleteDialog(true); }}
                              sx={{ borderRadius: '8px', borderColor: '#ef4444', color: '#dc2626', fontSize: '0.72rem' }}>
                              🗑️ Delete
                            </Button>
                          )}
                        </Box>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        </Paper>

        {/* Delete Dialog */}
        <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}
          fullWidth maxWidth="sm"
          PaperProps={{ sx: { borderRadius: '20px', m: { xs: 1, sm: 2 } } }}>
          <DialogTitle sx={{ color: '#dc2626', fontWeight: 800, pt: 3 }}>
            🗑️ Delete User
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: '#4a4a6a' }}>
              Delete <b style={{ color: '#1a1a2e' }}>{selectedUser?.fullName}</b>?
            </Typography>
            <Typography variant="caption" sx={{ color: '#dc2626', display: 'block', mt: 1 }}>
              ⚠️ This action cannot be undone!
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 0, gap: 1 }}>
            <Button onClick={() => setDeleteDialog(false)}
              sx={{ color: '#8888aa', borderRadius: '10px' }}>Cancel</Button>
            <Button variant="contained" onClick={handleDeleteConfirm}
              sx={{ borderRadius: '10px', bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={editDialog} onClose={() => setEditDialog(false)}
          fullWidth maxWidth="sm"
          PaperProps={{ sx: { borderRadius: '20px', m: { xs: 1, sm: 2 } } }}>
          <DialogTitle sx={{ color: '#d97706', fontWeight: 800, pt: 3 }}>
            🔄 Change Role
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: '#4a4a6a', mb: 2 }}>
              Change role for <b style={{ color: '#1a1a2e' }}>{selectedUser?.fullName}</b>
            </Typography>
            <FormControl fullWidth>
              <InputLabel>New Role</InputLabel>
              <Select value={newRole} label="New Role" onChange={e => setNewRole(e.target.value)}>
                <MenuItem value="Member">👤 Member</MenuItem>
                <MenuItem value="TeamLeader">👔 Team Leader</MenuItem>
                <MenuItem value="Admin">👑 Admin</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 0, gap: 1 }}>
            <Button onClick={() => setEditDialog(false)}
              sx={{ color: '#8888aa', borderRadius: '10px' }}>Cancel</Button>
            <Button variant="contained" onClick={handleEditRoleConfirm}
              sx={{ borderRadius: '10px' }}>Save</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Name Dialog */}
        <Dialog open={editNameDialog} onClose={() => setEditNameDialog(false)}
          fullWidth maxWidth="sm"
          PaperProps={{ sx: { borderRadius: '20px', m: { xs: 1, sm: 2 } } }}>
          <DialogTitle sx={{ color: '#6366f1', fontWeight: 800, pt: 3 }}>
            ✏️ Edit Name
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: '#4a4a6a', mb: 2 }}>
              Edit name for <b style={{ color: '#1a1a2e' }}>{selectedUser?.fullName}</b>
            </Typography>
            <TextField fullWidth label="Full Name"
              value={newName} onChange={e => setNewName(e.target.value)} />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 0, gap: 1 }}>
            <Button onClick={() => setEditNameDialog(false)}
              sx={{ color: '#8888aa', borderRadius: '10px' }}>Cancel</Button>
            <Button variant="contained" onClick={handleEditNameConfirm}
              sx={{ borderRadius: '10px' }}>Save</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default AdminPage;