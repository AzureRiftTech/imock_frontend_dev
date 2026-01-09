import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { handleOAuthCallback } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const oauthError = params.get('error');
    // remove token from URL helper
    const removeTokenFromUrl = () => {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('token');
        url.searchParams.delete('error');
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      } catch (e) {
        // fallback: replace with pathname only
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    if (oauthError) {
      setError(oauthError);
      // ensure error isn't left in URL
      removeTokenFromUrl();
      return;
    }

    if (!token) {
      setError('No token returned from provider');
      // ensure token isn't left in URL
      removeTokenFromUrl();
      return;
    }

    (async () => {
      try {
        const result = await handleOAuthCallback(token);
        // remove token from URL after processing
        removeTokenFromUrl();
        // If the user does not have details, route them to the details page
        if (result && result.hasDetails === false) {
          navigate('/user-details', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } catch (err) {
        setError('Failed to sign in with Google');
        // remove token if sign in failed
        removeTokenFromUrl();
      }
    })();
  }, []);

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" color="primary" fontWeight="bold" gutterBottom>
          Signing in...
        </Typography>
        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        ) : (
          <CircularProgress sx={{ mt: 2 }} />
        )}
      </Box>
    </Container>
  );
}
