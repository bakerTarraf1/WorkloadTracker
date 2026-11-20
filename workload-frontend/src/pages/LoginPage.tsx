import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Button, TextField, Typography,
  Alert, Tabs, Tab, FormControl,
  InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material';
import { login, register, forgotPassword, verifyCode, resetPassword } from '../api/auth';
import { useAuth } from '../context/AuthContext';

type Step = 'login' | 'register' | 'forgot' | 'verify' | 'reset';

// ✅ تحقق إن الـ Email هو Gmail
const isValidGmail = (email: string) =>
  /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email.trim());

const LoginPage = () => {
  const [step, setStep] = useState<Step>('login');
  const [tab, setTab] = useState(0);

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Member');
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Forgot / Verify / Reset
  const [fpEmail, setFpEmail] = useState('');
  const [fpCode, setFpCode] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState('');
  const [fpError, setFpError] = useState('');
  const [fpSuccess, setFpSuccess] = useState('');
  const [fpLoading, setFpLoading] = useState(false);

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  // ===== Handlers =====
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginError('Please fill all fields');
      return;
    }
    if (!isValidGmail(loginEmail)) {
      setLoginError('Email must be a valid @gmail.com address');
      return;
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      const data = await login(loginEmail, loginPassword);
      authLogin(data);
      navigate('/');
    } catch {
      setLoginError('Invalid email or password');
    }
    setLoginLoading(false);
  };

  const handleRegister = async () => {
    if (!regFullName || !regEmail || !regPassword) {
      setRegError('Please fill all fields');
      return;
    }
    if (!isValidGmail(regEmail)) {
      setRegError('Email must be a valid @gmail.com address');
      return;
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters');
      return;
    }
    setRegLoading(true);
    setRegError('');
    try {
      await register({ fullName: regFullName, email: regEmail, password: regPassword, role: regRole });
      const data = await login(regEmail, regPassword);
      authLogin(data);
      navigate('/');
    } catch (err: any) {
      setRegError(err?.response?.data?.[0]?.description || 'Registration failed. Email may already exist.');
    }
    setRegLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!fpEmail) { setFpError('Please enter your email'); return; }
    if (!isValidGmail(fpEmail)) { setFpError('Email must be a valid @gmail.com address'); return; }
    setFpLoading(true); setFpError(''); setFpSuccess('');
    try {
      await forgotPassword(fpEmail);
      setFpSuccess('Reset code sent! Check your email 📧');
      setStep('verify');
    } catch { setFpError('Failed to send reset code. Please try again.'); }
    setFpLoading(false);
  };

  const handleVerifyCode = async () => {
    if (!fpCode || fpCode.length !== 6) { setFpError('Please enter the 6-digit code'); return; }
    setFpLoading(true); setFpError('');
    try {
      await verifyCode(fpEmail, fpCode);
      setFpSuccess('Code verified! Set your new password.');
      setStep('reset');
    } catch (err: any) {
      setFpError(err?.response?.data?.message || 'Invalid or expired code');
    }
    setFpLoading(false);
  };

  const handleResetPassword = async () => {
    if (!fpNewPassword || !fpConfirmPassword) { setFpError('Please fill all fields'); return; }
    if (fpNewPassword.length < 6) { setFpError('Password must be at least 6 characters'); return; }
    if (fpNewPassword !== fpConfirmPassword) { setFpError('Passwords do not match'); return; }
    setFpLoading(true); setFpError('');
    try {
      await resetPassword(fpEmail, fpCode, fpNewPassword);
      setFpSuccess('Password reset successfully! ✅');
      setTimeout(() => {
        setStep('login');
        setFpEmail(''); setFpCode(''); setFpNewPassword(''); setFpConfirmPassword('');
        setFpSuccess('');
      }, 2000);
    } catch (err: any) {
      setFpError(err?.response?.data?.message || 'Failed to reset password');
    }
    setFpLoading(false);
  };

  // ===== Styles =====
  const cardSx = {
    width: '100%', maxWidth: { xs: '100%', sm: 460 },
    position: 'relative', zIndex: 1,
    background: 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    border: '1.5px solid rgba(255,255,255,0.8)',
    borderRadius: { xs: '20px', sm: '28px' },
    p: { xs: '24px 20px', sm: '40px 44px' },
    boxShadow: '0 20px 60px rgba(99,102,241,0.1)',
    overflow: 'hidden',
    animation: 'fadeUp 0.5s ease forwards',
    '@keyframes fadeUp': { from: { opacity: 0, transform: 'translateY(24px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
    '&::before': {
      content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
      background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
      backgroundSize: '200% 200%', animation: 'gradShift 3s ease infinite',
    },
    '@keyframes gradShift': {
      '0%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
      '100%': { backgroundPosition: '0% 50%' },
    }
  };

  const btnSx = {
    py: { xs: 1.3, sm: 1.5 }, fontSize: { xs: '0.9rem', sm: '1rem' },
    fontWeight: 700, borderRadius: '12px',
    background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
    backgroundSize: '200% 200%', animation: 'gradShift 3s ease infinite',
    boxShadow: '0 4px 20px rgba(99,102,241,0.35)', border: 'none',
    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 30px rgba(99,102,241,0.5)' },
    '&:disabled': { opacity: 0.7 },
  };

  const gradientText = {
    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text', cursor: 'pointer', fontWeight: 700,
    '&:hover': { opacity: 0.8 }
  };

  const Logo = () => (
    <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
      <Box sx={{
        width: { xs: 52, sm: 60 }, height: { xs: 52, sm: 60 },
        borderRadius: '16px', mx: 'auto', mb: 2,
        background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
        backgroundSize: '200% 200%', animation: 'gradShift 3s ease infinite',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: { xs: '22px', sm: '26px' }, fontWeight: 900, color: 'white',
        boxShadow: '0 8px 30px rgba(99,102,241,0.35)',
      }}>W</Box>
      <Typography fontWeight={900} sx={{
        fontSize: { xs: '1.3rem', sm: '1.6rem' }, letterSpacing: '-0.03em',
        background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
        backgroundSize: '200% 200%', WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        animation: 'gradShift 3s ease infinite',
      }}>WorkloadTracker</Typography>
      <Typography variant="body2" sx={{ color: '#8888aa', mt: 0.5, fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
        Team Task & Workload Management
      </Typography>
    </Box>
  );

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #fafafa 0%, #f0f0ff 50%, #fff0f8 100%)',
      padding: { xs: '16px', sm: '24px' },
      position: 'relative', overflow: 'hidden',
    }}>
      <Box sx={{
        position: 'fixed', top: '-20%', right: '-10%',
        width: { xs: 250, md: 500 }, height: { xs: 250, md: 500 }, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
        animation: 'floatOrb 8s ease-in-out infinite',
        '@keyframes floatOrb': { '0%, 100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(-20px, 20px)' } }
      }} />
      <Box sx={{
        position: 'fixed', bottom: '-20%', left: '-10%',
        width: { xs: 200, md: 450 }, height: { xs: 200, md: 450 }, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* FORGOT PASSWORD */}
      {step === 'forgot' && (
        <Box sx={cardSx}>
          <Logo />
          <Button onClick={() => { setStep('login'); setFpError(''); setFpSuccess(''); }}
            sx={{ mb: 2, color: '#8888aa', fontSize: '0.82rem', '&:hover': { color: '#6366f1' } }}>
            ← Back to Login
          </Button>
          <Typography variant="h6" fontWeight={800} sx={{ color: '#1a1a2e', mb: 0.5 }}>
            Forgot Password? 🔐
          </Typography>
          <Typography variant="body2" sx={{ color: '#8888aa', mb: 3 }}>
            Enter your Gmail and we'll send you a reset code
          </Typography>
          {fpError && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.82rem' }}>{fpError}</Alert>}
          {fpSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.82rem' }}>{fpSuccess}</Alert>}
          <TextField fullWidth label="Gmail" type="email"
            placeholder="example@gmail.com"
            value={fpEmail}
            onChange={e => setFpEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleForgotPassword()}
            error={fpEmail.length > 0 && !isValidGmail(fpEmail)}
            helperText={fpEmail.length > 0 && !isValidGmail(fpEmail) ? 'Must be @gmail.com' : ''}
            sx={{ mb: 3 }} />
          <Button fullWidth variant="contained" onClick={handleForgotPassword}
            disabled={fpLoading} sx={btnSx}>
            {fpLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} color="inherit" />
                <span>Sending code...</span>
              </Box>
            ) : '📧 Send Reset Code'}
          </Button>
        </Box>
      )}

      {/* VERIFY CODE */}
      {step === 'verify' && (
        <Box sx={cardSx}>
          <Logo />
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography sx={{ fontSize: '3rem' }}>📬</Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: '#1a1a2e', mt: 1 }}>
              Check Your Email
            </Typography>
            <Typography variant="body2" sx={{ color: '#8888aa', mt: 0.5 }}>
              We sent a 6-digit code to
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ color: '#6366f1' }}>
              {fpEmail}
            </Typography>
          </Box>
          {fpError && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.82rem' }}>{fpError}</Alert>}
          {fpSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.82rem' }}>{fpSuccess}</Alert>}
          <TextField fullWidth label="6-Digit Code" type="text"
            value={fpCode}
            onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 6); setFpCode(v); }}
            inputProps={{ maxLength: 6, style: { textAlign: 'center', fontSize: '1.8rem', letterSpacing: '8px', fontWeight: 800 } }}
            sx={{ mb: 3 }} />
          <Button fullWidth variant="contained" onClick={handleVerifyCode}
            disabled={fpLoading || fpCode.length !== 6} sx={{ ...btnSx, mb: 2 }}>
            {fpLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} color="inherit" />
                <span>Verifying...</span>
              </Box>
            ) : '✅ Verify Code'}
          </Button>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ color: '#8888aa', fontSize: '0.78rem' }}>
              Didn't receive it?{' '}
              <Box component="span" onClick={handleForgotPassword} sx={gradientText}>Resend</Box>
            </Typography>
            <Box component="span"
              onClick={() => { setStep('login'); setFpError(''); setFpCode(''); }}
              sx={{ ...gradientText, fontSize: '0.78rem' }}>
              ← Back
            </Box>
          </Box>
        </Box>
      )}

      {/* RESET PASSWORD */}
      {step === 'reset' && (
        <Box sx={cardSx}>
          <Logo />
          <Typography variant="h6" fontWeight={800} sx={{ color: '#1a1a2e', mb: 0.5 }}>
            Set New Password 🔑
          </Typography>
          <Typography variant="body2" sx={{ color: '#8888aa', mb: 3 }}>
            Choose a strong password for your account
          </Typography>
          {fpError && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.82rem' }}>{fpError}</Alert>}
          {fpSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.82rem' }}>{fpSuccess}</Alert>}
          <TextField fullWidth label="New Password" type="password"
            value={fpNewPassword} onChange={e => setFpNewPassword(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Confirm Password" type="password"
            value={fpConfirmPassword} onChange={e => setFpConfirmPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
            error={fpConfirmPassword.length > 0 && fpNewPassword !== fpConfirmPassword}
            helperText={fpConfirmPassword.length > 0 && fpNewPassword !== fpConfirmPassword ? 'Passwords do not match' : ''}
            sx={{ mb: 3 }} />
          <Button fullWidth variant="contained" onClick={handleResetPassword}
            disabled={fpLoading} sx={btnSx}>
            {fpLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={18} color="inherit" />
                <span>Resetting...</span>
              </Box>
            ) : '🔑 Reset Password'}
          </Button>
        </Box>
      )}

      {/* LOGIN & REGISTER */}
      {(step === 'login' || step === 'register') && (
        <Box sx={cardSx}>
          <Logo />

          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{
            mb: 3, background: '#f4f4f8', borderRadius: '12px', p: '4px', minHeight: 'unset',
            '& .MuiTabs-indicator': { display: 'none' },
            '& .MuiTab-root': {
              color: '#8888aa', fontWeight: 600, fontSize: { xs: '0.82rem', sm: '0.88rem' },
              borderRadius: '10px', minHeight: '38px', padding: '6px 16px',
              transition: 'all 0.2s', textTransform: 'none',
            },
            '& .Mui-selected': {
              color: '#ffffff !important',
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            },
          }}>
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {/* LOGIN */}
          {tab === 0 && (
            <Box sx={{ animation: 'fadeIn 0.3s ease', '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } } }}>
              {loginError && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.82rem' }}>{loginError}</Alert>}

              <TextField fullWidth label="Gmail" type="email"
                placeholder="example@gmail.com"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                error={loginEmail.length > 0 && !isValidGmail(loginEmail)}
                helperText={loginEmail.length > 0 && !isValidGmail(loginEmail) ? 'Must be @gmail.com' : ''}
                sx={{ mb: 2 }} />

              <TextField fullWidth label="Password" type="password"
                value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                sx={{ mb: 1 }} />

              <Box sx={{ textAlign: 'right', mb: 2.5 }}>
                <Box component="span"
                  onClick={() => { setStep('forgot'); setFpEmail(loginEmail); setFpError(''); }}
                  sx={{ ...gradientText, fontSize: '0.82rem' }}>
                  Forgot password?
                </Box>
              </Box>

              <Button fullWidth variant="contained" onClick={handleLogin}
                disabled={loginLoading} sx={btnSx}>
                {loginLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={18} color="inherit" />
                    <span>Logging in...</span>
                  </Box>
                ) : 'Login →'}
              </Button>

              <Typography variant="body2" textAlign="center" mt={2.5} sx={{
                color: '#8888aa', fontSize: { xs: '0.78rem', sm: '0.85rem' }
              }}>
                Don't have an account?{' '}
                <Box component="span" onClick={() => setTab(1)} sx={gradientText}>
                  Register here
                </Box>
              </Typography>
            </Box>
          )}

          {/* REGISTER */}
          {tab === 1 && (
            <Box sx={{ animation: 'fadeIn 0.3s ease' }}>
              {regError && <Alert severity="error" sx={{ mb: 2, borderRadius: '10px', fontSize: '0.82rem' }}>{regError}</Alert>}

              <TextField fullWidth label="Full Name" value={regFullName}
                onChange={e => setRegFullName(e.target.value)} sx={{ mb: 2 }} />

              <TextField fullWidth label="Gmail" type="email"
                placeholder="example@gmail.com"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                error={regEmail.length > 0 && !isValidGmail(regEmail)}
                helperText={regEmail.length > 0 && !isValidGmail(regEmail) ? 'Must be @gmail.com' : ''}
                sx={{ mb: 2 }} />

              <TextField fullWidth label="Password" type="password"
                value={regPassword} onChange={e => setRegPassword(e.target.value)}
                sx={{ mb: 2 }} />

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Role</InputLabel>
                <Select value={regRole} label="Role" onChange={e => setRegRole(e.target.value)}>
                  <MenuItem value="Member">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>👤</Box>
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#1a1a2e', lineHeight: 1.2 }}>Member</Typography>
                        <Typography variant="caption" sx={{ color: '#8888aa', fontSize: '0.7rem' }}>View & update assigned tasks</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="TeamLeader">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>👔</Box>
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#1a1a2e', lineHeight: 1.2 }}>Team Leader</Typography>
                        <Typography variant="caption" sx={{ color: '#8888aa', fontSize: '0.7rem' }}>Create & assign tasks</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="Admin">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.5 }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>👑</Box>
                      <Box>
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#1a1a2e', lineHeight: 1.2 }}>Admin</Typography>
                        <Typography variant="caption" sx={{ color: '#8888aa', fontSize: '0.7rem' }}>Full system access</Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <Button fullWidth variant="contained" onClick={handleRegister}
                disabled={regLoading} sx={btnSx}>
                {regLoading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={18} color="inherit" />
                    <span>Creating account...</span>
                  </Box>
                ) : 'Create Account ✨'}
              </Button>

              <Typography variant="body2" textAlign="center" mt={2.5} sx={{
                color: '#8888aa', fontSize: { xs: '0.78rem', sm: '0.85rem' }
              }}>
                Already have an account?{' '}
                <Box component="span" onClick={() => setTab(0)} sx={gradientText}>
                  Login
                </Box>
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default LoginPage;