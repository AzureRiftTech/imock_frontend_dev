import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Link, Alert, Paper } from '@mui/material';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login(email, password);
      const user = res.user;
      if (user && user.email_verified === 0) {
        navigate('/verify-email');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
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
            Sign in to iMock
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Welcome back! Please enter your details.
          </Typography>
          {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address or Username"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Link component={RouterLink} to="/forgot-password" variant="body2" underline="hover">
                Forgot password?
              </Link>
              <Link component={RouterLink} to="/register" variant="body2" underline="hover">
                {"Don't have an account? Sign Up"}
              </Link>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => { window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333'}/auth/google`; }}
              >
                Sign in with Google
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<LinkedInIcon />}
                onClick={() => { window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333'}/auth/linkedin`; }}
                sx={{ mt: 1, borderColor: '#0a66c2', color: '#0a66c2' }}
                aria-label="Sign in with LinkedIn"
              >
                Sign in with LinkedIn
              </Button>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<GitHubIcon />}
                onClick={() => { window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333'}/auth/github`; }}
                sx={{ mt: 1, borderColor: '#24292f', color: '#24292f' }}
                aria-label="Sign in with GitHub"
              >
                Sign in with GitHub
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
