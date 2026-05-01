import { Box } from '@mui/material';

const WorkloadBadge = ({ status }: { status: string }) => {
  const config = {
    Available: {
      bg: 'rgba(16,185,129,0.15)',
      color: '#10b981',
      border: 'rgba(16,185,129,0.3)',
      dot: '#10b981',
      label: '🟢 Available'
    },
    Moderate: {
      bg: 'rgba(245,158,11,0.15)',
      color: '#f59e0b',
      border: 'rgba(245,158,11,0.3)',
      dot: '#f59e0b',
      label: '🟡 Moderate'
    },
    Overloaded: {
      bg: 'rgba(239,68,68,0.15)',
      color: '#ef4444',
      border: 'rgba(239,68,68,0.3)',
      dot: '#ef4444',
      label: '🔴 Overloaded'
    }
  };

  const c = config[status as keyof typeof config] || config.Available;

  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.8,
      px: 1.5, py: 0.5, borderRadius: 2,
      bgcolor: c.bg, color: c.color,
      border: `1px solid ${c.border}`,
      fontWeight: 700, fontSize: '0.78rem',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <Box sx={{
        width: 7, height: 7, borderRadius: '50%',
        bgcolor: c.dot,
        boxShadow: `0 0 8px ${c.dot}`,
        animation: 'pulse 2s infinite'
      }} />
      {status}
    </Box>
  );
};

export default WorkloadBadge;