import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import MemberDetailPage from './pages/MemberDetailPage';
import TaskDetailPage from './pages/TaskDetailPage';
import TaskFormPage from './pages/TaskFormPage';
import ChangeRequestsPage from './pages/ChangeRequestsPage';
import ReportsPage from './pages/ReportsPage';
import AITaskGeneratorPage from './pages/AITaskGeneratorPage';
import MessagesPage from './pages/MessagesPage';
import StandupPage from './pages/StandupPage';
import StandupReportPage from './pages/StandupReportPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';
import './index.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
    secondary: { main: '#ec4899' },
    background: { default: '#fafafa', paper: '#ffffff' },
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    text: { primary: '#1a1a2e', secondary: '#4a4a6a' },
  },
  typography: {
    fontFamily: "'Outfit', sans-serif",
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
          border: '1px solid #e8e8f0',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          fontFamily: "'Outfit', sans-serif",
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            backgroundColor: '#f8f8fc',
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: '1px solid #e8e8f0',
          borderRadius: 16,
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 600 }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255,255,255,0.85)',
          boxShadow: 'none',
          borderBottom: '1px solid #e8e8f0',
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            backgroundColor: '#f4f4f8',
            color: '#8888aa',
            fontWeight: 700,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            borderBottom: '1px solid #e8e8f0',
            color: '#1a1a2e',
          },
          '&:hover': {
            backgroundColor: 'rgba(99,102,241,0.03) !important'
          }
        }
      }
    },
    MuiDivider: {
      styleOverrides: { root: { borderColor: '#e8e8f0' } }
    },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: 10, backgroundColor: '#f8f8fc' }
      }
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontFamily: "'Outfit', sans-serif",
        }
      }
    }
  }
});
function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/members/:userId" element={<ProtectedRoute><MemberDetailPage /></ProtectedRoute>} />
            <Route path="/tasks/new" element={<ProtectedRoute><TaskFormPage /></ProtectedRoute>} />
            <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetailPage /></ProtectedRoute>} />
            <Route path="/tasks/:id/edit" element={<ProtectedRoute><TaskFormPage /></ProtectedRoute>} />
            <Route path="/change-requests" element={<ProtectedRoute><ChangeRequestsPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/ai-generator" element={<ProtectedRoute><AITaskGeneratorPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/standup" element={<ProtectedRoute><StandupPage /></ProtectedRoute>} />
            <Route path="/standup-report" element={<ProtectedRoute><StandupReportPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;