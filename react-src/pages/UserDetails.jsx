import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, TextField, Button, Alert, Paper, Grid, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function UserDetails() {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/user-details/me');
        setDetails(res.data.details || null);
      } catch (err) {
        console.error('Failed to fetch details', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleChange = (key) => (e) => {
    setDetails(prev => ({ ...(prev || {}), [key]: e.target.value }));
  };

  function validateUserDetails(payload) {
    const errs = {};
    if (payload.year_of_passout && !/^\d{4}$/.test(String(payload.year_of_passout))) errs.year_of_passout = 'Year must be a 4-digit year';
    const phoneRegex = /^[+\d\s\-()]{7,20}$/;
    if (payload.contact_number && !phoneRegex.test(String(payload.contact_number))) errs.contact_number = 'Invalid contact number';
    if (payload.phone && !phoneRegex.test(String(payload.phone))) errs.phone = 'Invalid phone number';
    return errs;
  }

  const [formErrors, setFormErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    const validation = validateUserDetails(details || {});
    if (Object.keys(validation).length) {
      setFormErrors(validation);
      setError('Please fix validation errors');
      setSaving(false);
      return;
    }

    try {
      if (details && details.user_id) {
        const res = await api.put('/user-details/me', details);
        setDetails(res.data);
        setMessage('Details updated — redirecting to dashboard...');
      } else {
        const res = await api.post('/user-details', details || {});
        setDetails(res.data);
        setMessage('Details saved — redirecting to dashboard...');
      }
      setTimeout(() => navigate('/'), 800);
      setFormErrors({});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save details');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError('');
    setMessage('');
    try {
      const form = new FormData();
      files.forEach(f => form.append('resumes', f));
      const res = await api.post('/user-details/me/resume', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDetails(res.data);
      setMessage('Resumes uploaded');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload resumes');
    }
  };

  if (loading) return null;

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ marginTop: 6, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 4 }}>
          <Typography component="h1" variant="h5" color="primary" fontWeight="bold" gutterBottom>
            Tell us about yourself
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Complete your profile so we can tailor your experience. You can upload one or more resumes.
          </Typography>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {message && <Alert severity="success" sx={{ mt: 2 }}>{message}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select labelId="role-label" value={details?.current_role || 'Student'} label="Role" onChange={(e) => setDetails(prev => ({ ...(prev||{}), current_role: e.target.value }))}>
                    <MenuItem value="Student">Student</MenuItem>
                    <MenuItem value="Fresher">Fresher</MenuItem>
                    <MenuItem value="Professional">Professional</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Full name" value={details?.full_name || ''} onChange={handleChange('full_name')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Headline" value={details?.headline || ''} onChange={handleChange('headline')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="University" value={details?.university_name || ''} onChange={handleChange('university_name')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="College" value={details?.college_name || ''} onChange={handleChange('college_name')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Branch" value={details?.branch || ''} onChange={handleChange('branch')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Year of passout" value={details?.year_of_passout || ''} onChange={handleChange('year_of_passout')} error={!!formErrors.year_of_passout} helperText={formErrors.year_of_passout || ''} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Contact number" value={details?.contact_number || ''} onChange={handleChange('contact_number')} error={!!formErrors.contact_number} helperText={formErrors.contact_number || ''} />
              </Grid>

              <Grid item xs={12}>
                <TextField fullWidth label="Bio" multiline minRows={3} value={details?.bio || ''} onChange={handleChange('bio')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Location" value={details?.location || ''} onChange={handleChange('location')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Phone" value={details?.phone || ''} onChange={handleChange('phone')} error={!!formErrors.phone} helperText={formErrors.phone || ''} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="LinkedIn" value={details?.linkedin || ''} onChange={handleChange('linkedin')} />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="GitHub" value={details?.github || ''} onChange={handleChange('github')} />
              </Grid>

              <Grid item xs={12}>
                <input id="resumes" type="file" multiple onChange={handleResumeUpload} />
                {details?.resumes && details.resumes.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">Uploaded resumes:</Typography>
                    <ul>
                      {details.resumes.map((r, i) => (
                        <li key={i}><a href={r} target="_blank" rel="noreferrer">{r}</a></li>
                      ))}
                    </ul>
                  </Box>
                )}
              </Grid>
              {/* <Grid item xs={12}>
                <input id="resumes" type="file" multiple onChange={handleResumeUpload} />
                {details?.resumes && details.resumes.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">Uploaded resumes:</Typography>
                    <ul>
                      {details.resumes.map((r, i) => (
                        <li key={i}><a href={r} target="_blank" rel="noreferrer">{r}</a></li>
                      ))}
                    </ul>
                  </Box>
                )}
              </Grid> */}
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button type="submit" variant="contained" disabled={saving}>{details && details.user_id ? 'Update Profile' : 'Save Profile'}</Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
