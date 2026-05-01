import { useState } from 'react';
import { Box, Typography, Paper, Button, CircularProgress, Alert, Divider } from '@mui/material';
import { generateStandup, sendStandup } from '../api/standup';
import Navbar from '../components/Navbar';

const StandupPage = () => {
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGenerate = async () => {
    setLoading(true); setError(''); setReport('');
    try { const data = await generateStandup(); setReport(data.report); }
    catch { setError('Failed to generate report.'); }
    setLoading(false);
  };

  const handleSend = async () => {
    setSending(true); setError('');
    try { await sendStandup(); setSuccess('✅ Report sent!'); setTimeout(() => setSuccess(''), 4000); }
    catch { setError('Failed to send.'); }
    setSending(false);
  };

  const formatReport = (text: string) => text.split('\n').map((line, i) => {
    const t = line.trim();
    if (!t) return <br key={i} />;
    if (t.startsWith('Good morning') || t.startsWith('##'))
      return <Typography key={i} variant="h6" fontWeight={800} sx={{ color: '#1a1a2e', mb: 1, fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>{t.replace('##', '').trim()}</Typography>;
    if (t.startsWith('-') || t.startsWith('•') || t.startsWith('*'))
      return <Typography key={i} variant="body2" sx={{ color: '#4a4a6a', pl: 2, mb: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{t}</Typography>;
    if (/[\u{1F300}-\u{1F9FF}]/u.test(t))
      return <Typography key={i} variant="body1" fontWeight={700} sx={{ color: '#1a1a2e', mb: 0.8, fontSize: { xs: '0.875rem', sm: '1rem' } }}>{t}</Typography>;
    return <Typography key={i} variant="body2" sx={{ color: '#4a4a6a', mb: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{t}</Typography>;
  });

  return (
    <>
      <Navbar />
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
        <Box sx={{ mb: { xs: 3, sm: 4 }, textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={900} sx={{
            fontSize: { xs: '1.5rem', sm: '2rem' },
            background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', mb: 1,
          }}>
            🧠 AI Daily Standup
          </Typography>
          <Typography sx={{ color: '#8888aa', fontSize: { xs: '0.82rem', sm: '0.875rem' } }}>
            Generate your daily team report powered by AI
          </Typography>
        </Box>

        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2.5 }}>
          <Typography variant="h6" fontWeight={700} mb={1} sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
            📊 Generate Today's Report
          </Typography>
          <Typography variant="body2" sx={{ color: '#8888aa', mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            AI analyzes team tasks, workload, and progress to generate a comprehensive report.
          </Typography>
          <Button fullWidth variant="contained" size="large" onClick={handleGenerate} disabled={loading}
            sx={{ py: { xs: 1.3, sm: 1.5 }, fontSize: { xs: '0.9rem', sm: '1rem' }, fontWeight: 700, borderRadius: '12px' }}>
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} color="inherit" />
                <span>AI is analyzing...</span>
              </Box>
            ) : '🧠 Generate Standup Report'}
          </Button>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.875rem' }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '12px', fontSize: '0.875rem' }}>{success}</Alert>}

        {report && (
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{
              display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.5, sm: 0 }, mb: 2
            }}>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                📋 Today's Report
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                <Button variant="outlined" size="small" onClick={handleGenerate} disabled={loading}
                  sx={{ borderRadius: '10px', borderColor: '#e8e8f0', color: '#8888aa', flex: { xs: 1, sm: 'none' }, fontSize: '0.78rem' }}>
                  🔄 Regenerate
                </Button>
                <Button variant="contained" size="small" onClick={handleSend} disabled={sending}
                  sx={{ borderRadius: '10px', bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, flex: { xs: 1, sm: 'none' }, fontSize: '0.78rem' }}>
                  {sending ? <CircularProgress size={14} color="inherit" /> : '📤 Send to Leaders'}
                </Button>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{
              p: { xs: 1.5, sm: 2 }, borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.03), rgba(236,72,153,0.02))',
              border: '1.5px solid rgba(99,102,241,0.1)', lineHeight: 1.8,
            }}>
              {formatReport(report)}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: '12px', background: 'rgba(16,185,129,0.04)', border: '1.5px solid rgba(16,185,129,0.15)' }}>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#059669', mb: 0.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                📤 Send Report will:
              </Typography>
              <Typography variant="caption" sx={{ color: '#4a4a6a', display: 'block', fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                ✅ Send Notification to all Team Leaders & Admins 🔔
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>
    </>
  );
};

export default StandupPage;