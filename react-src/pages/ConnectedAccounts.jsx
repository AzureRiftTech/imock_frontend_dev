import { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, Button, Alert, CircularProgress, List, ListItem, ListItemText } from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function ConnectedAccounts() {
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState(null);
  const [connectionsError, setConnectionsError] = useState('');
  const [linkedInPictureUrl, setLinkedInPictureUrl] = useState('');
  const [linkedInProfile, setLinkedInProfile] = useState(null);
  const [githubRepos, setGithubRepos] = useState(null);
  const [error, setError] = useState('');

  const fetchConnections = async () => {
    setConnectionsError('');
    setLoading(true);
    try {
      const res = await api.get('/auth/connections');
      setConnections(res.data.connections || []);
    } catch (err) {
      console.error(err);
      setConnectionsError(err.response?.data?.error || 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchLinkedInPicture = async () => {
    setError('');
    try {
      const res = await api.get('/auth/provider/linkedin/profile-picture');
      setLinkedInPictureUrl(res.data.picture || '');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch LinkedIn profile picture');
    }
  };

  const fetchLinkedInProfile = async () => {
    setError('');
    try {
      const res = await api.get('/auth/provider/linkedin/profile');
      setLinkedInProfile(res.data.profile || null);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch LinkedIn profile');
    }
  };

  const fetchGitHubRepos = async () => {
    setError('');
    try {
      const res = await api.get('/auth/provider/github/repos');
      setGithubRepos(res.data.repos || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch GitHub repos');
    }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom fontWeight="bold">Connected Accounts</Typography>

      <Paper sx={{ p: 3 }} elevation={3}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Manage and view data from GitHub and LinkedIn connected to your account.
        </Typography>

        {connectionsError && <Alert severity="error" sx={{ mb: 2 }}>{connectionsError}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>}

        {!loading && connections && connections.length === 0 && <Typography color="text.secondary">No connected accounts.</Typography>}

        {!loading && connections && connections.length > 0 && (
          <Box>
            {connections.map((c) => (
              <Box key={c.provider} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>{c.provider}</Typography>
                  <Typography variant="body2" color="text.secondary">{c.provider_user_id ? `ID: ${c.provider_user_id}` : ''}</Typography>
                  <Typography variant="body2" color="text.secondary">{c.scope}</Typography>
                </Box>
                <Box>
                  {c.provider === 'linkedin' && (
                    <>
                      <Button size="small" variant="outlined" onClick={() => fetchLinkedInProfile()} sx={{ mr: 1 }}>Show profile</Button>
                      <Button size="small" variant="outlined" onClick={() => fetchLinkedInPicture()} sx={{ mr: 1 }}>Show picture</Button>
                    </>
                  )}
                  {c.provider === 'github' && (
                    <Button size="small" variant="outlined" onClick={() => fetchGitHubRepos()} sx={{ mr: 1 }}>List repos</Button>
                  )}
                </Box>
              </Box>
            ))}

            {linkedInProfile && (
              <Paper sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }} variant="outlined">
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>LinkedIn Public Profile</Typography>
                <Box sx={{ display: 'grid', gap: 1 }}>
                  {linkedInProfile.name && <Typography variant="body2"><strong>Name:</strong> {linkedInProfile.name}</Typography>}
                  {linkedInProfile.given_name && <Typography variant="body2"><strong>Given Name:</strong> {linkedInProfile.given_name}</Typography>}
                  {linkedInProfile.family_name && <Typography variant="body2"><strong>Family Name:</strong> {linkedInProfile.family_name}</Typography>}
                  {linkedInProfile.email && <Typography variant="body2"><strong>Email:</strong> {linkedInProfile.email}</Typography>}
                  {linkedInProfile.picture && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" fontWeight="bold">Picture:</Typography>
                      <Box component="img" src={linkedInProfile.picture} alt="LinkedIn" sx={{ width: 100, height: 100, borderRadius: '50%', mt: 1 }} />
                    </Box>
                  )}
                  {linkedInProfile.locale && (
                    <Typography variant="body2">
                      <strong>Locale:</strong> {typeof linkedInProfile.locale === 'object' 
                        ? `${linkedInProfile.locale.language || ''}_${linkedInProfile.locale.country || ''}`.trim() 
                        : linkedInProfile.locale}
                    </Typography>
                  )}
                  {linkedInProfile.sub && <Typography variant="body2"><strong>Sub (ID):</strong> {linkedInProfile.sub}</Typography>}
                </Box>
              </Paper>
            )}

            {linkedInPictureUrl && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">LinkedIn profile picture</Typography>
                <Box component="img" src={linkedInPictureUrl} alt="LinkedIn" sx={{ width: 120, height: 120, borderRadius: '50%' }} />
              </Box>
            )}

            {githubRepos && githubRepos.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2">GitHub repositories</Typography>
                <List>
                  {githubRepos.map(repo => (
                    <ListItem key={repo.id} disablePadding>
                      <ListItemText primary={<a href={repo.html_url} target="_blank" rel="noreferrer">{repo.full_name}</a>} secondary={repo.description} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        )}

        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={fetchConnections} sx={{ mr: 1 }}>Refresh</Button>
          <Button variant="contained" onClick={() => { window.location.href = '/profile'; }}>Back to Profile</Button>
        </Box>
      </Paper>
    </Container>
  );
}