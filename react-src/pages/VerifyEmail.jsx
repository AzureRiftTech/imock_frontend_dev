import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Alert, Paper } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, verifyEmail, resendOtp } = useAuth();
  const navigate = useNavigate();

  // if email already verified, redirect to dashboard
  useEffect(() => {
    if (user && user.email_verified === 1) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await verifyEmail(otp);
      setMessage('Email verified — please complete your profile');
      setTimeout(() => navigate('/user-details'), 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    try {
      await resendOtp();
      setMessage('OTP resent. Check your email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', borderRadius: 4 }}>
          <Typography component="h1" variant="h5" color="primary" fontWeight="bold" gutterBottom>
            Verify Your Email
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Enter the 6-digit code we sent to <strong>{user?.email}</strong>
          </Typography>
          {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
          {message && <Alert severity="success" sx={{ mt: 2, width: '100%' }}>{message}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="otp"
              label="Verification Code"
              name="otp"
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              Verify
            </Button>
            <Button
              type="button"
              fullWidth
              variant="outlined"
              size="small"
              onClick={handleResend}
            >
              Resend Code
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
