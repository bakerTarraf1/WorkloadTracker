import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, Divider } from '@mui/material';
import Navbar from '../components/Navbar';

const StandupReportPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const report = location.state?.report || 'No report available';

  const formatReport = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return <br key={i} />;

      if (trimmed.startsWith('Good morning') || trimmed.startsWith('##')) {
        return (
          <Typography key={i} variant="h6" fontWeight={800}
            sx={{ color: '#f1f5f9', mb: 1 }}>
            {trimmed.replace('##', '').trim()}
          </Typography>
        );
      }

      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
        return (
          <Typography key={i} variant="body2"
            sx={{ color: '#94a3b8', pl: 2, mb: 0.5 }}>
            {trimmed}
          </Typography>
        );
      }

      if (/[\u{1F300}-\u{1F9FF}]/u.test(trimmed)) {
        return (
          <Typography key={i} variant="body1" fontWeight={600}
            sx={{ color: '#f1f5f9', mb: 0.8 }}>
            {trimmed}
          </Typography>
        );
      }

      return (
        <Typography key={i} variant="body2"
          sx={{ color: '#94a3b8', mb: 0.5 }}>
          {trimmed}
        </Typography>
      );
    });
  };

  return (
    <>
      <Navbar />
      <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
        <Button onClick={() => navigate(-1)} sx={{ mb: 2, color: '#94a3b8' }}>
          ← Back
        </Button>

        <Typography variant="h5" fontWeight={800} mb={3} sx={{
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          🧠 Daily Standup Report
        </Typography>

        <Paper sx={{ p: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{
            p: 2, borderRadius: 2,
            bgcolor: 'rgba(59,130,246,0.03)',
            border: '1px solid rgba(59,130,246,0.1)',
            lineHeight: 1.8
          }}>
            {formatReport(report)}
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default StandupReportPage;