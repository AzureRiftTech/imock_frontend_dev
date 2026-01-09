import { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Box, Button, Grid, 
  List, ListItem, ListItemIcon, ListItemText, Alert, CircularProgress, TextField,
  Card, CardContent, Divider, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchDetails = async () => {
    try {
      const res = await api.get('/user-details/me');
      // API returns { details, credits, total_credits } for GET
      setDetails(res.data?.details || res.data || null);
    } catch (err) {
      // If 404, it means no details yet, which is fine
      if (err.response && err.response.status !== 404) {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const [creditPackages, setCreditPackages] = useState(null);
  const [packagesError, setPackagesError] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [totalCredits, setTotalCredits] = useState(0);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetchDetails();
    fetchConnections();
    fetchPackages();
    fetchTotalCredits();
    fetchSubscription();
    fetchInvoices();
  }, []);

  const [deleting, setDeleting] = useState(null);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('resumes', files[i]);
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/user-details/me/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('Resume uploaded successfully!');
      fetchDetails(); // Refresh list
    } catch (err) {
      console.error(err);
      setError('Failed to upload resume.');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = null;
    }
  };

  const handleDeleteResume = async (url) => {
    if (!window.confirm('Delete this resume?')) return;
    setError(''); setSuccess('');
    setDeleting(url);
    try {
      await api.delete('/user-details/me/resume', { data: { url } });
      setSuccess('Resume deleted');
      fetchDetails();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to delete resume');
    } finally {
      setDeleting(null);
    }
  };

  const getResumes = () => {
    if (!details || !details.resumes) return [];
    try {
      return typeof details.resumes === 'string' ? JSON.parse(details.resumes) : details.resumes;
    } catch (e) {
      return [];
    }
  };

  const resumes = getResumes();

  const [connections, setConnections] = useState(null);
  const [connectionsError, setConnectionsError] = useState('');
  const [linkedInPictureUrl, setLinkedInPictureUrl] = useState('');
  const [githubRepos, setGithubRepos] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const fetchConnections = async () => {
    setConnectionsError('');
    try {
      const res = await api.get('/auth/connections');
      setConnections(res.data.connections || []);
    } catch (err) {
      console.error(err);
      setConnectionsError(err.response?.data?.error || 'Failed to load connections');
    }
  };

  function validateProfileFields(payload) {
    const errs = {};
    const year = payload.year_of_passout;
    if (year && !/^\d{4}$/.test(String(year))) errs.year_of_passout = 'Year must be a 4-digit year';
    const phoneRegex = /^[+\d\s\-()]{7,20}$/;
    if (payload.contact_number && !phoneRegex.test(String(payload.contact_number))) errs.contact_number = 'Invalid contact number';
    if (payload.phone && !phoneRegex.test(String(payload.phone))) errs.phone = 'Invalid phone number';
    return errs;
  }
  const fetchLinkedInPicture = async () => {
    setError(''); setSuccess('');
    try {
      const res = await api.get('/auth/provider/linkedin/profile-picture');
      setLinkedInPictureUrl(res.data.picture || '');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch LinkedIn profile picture');
    }
  };

  const fetchGitHubRepos = async () => {
    setError(''); setSuccess('');
    try {
      const res = await api.get('/auth/provider/github/repos');
      setGithubRepos(res.data.repos || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch GitHub repos');
    }
  };

  const fetchPackages = async () => {
    setPackagesError('');
    try {
      const res = await api.get('/credits/packages');
      setCreditPackages(res.data.packages || []);
    } catch (err) {
      console.error(err);
      setPackagesError(err.response?.data?.error || 'Failed to load packages');
    }
  };

  const fetchTotalCredits = async () => {
    try {
      const res = await api.get('/auth/me');
      setTotalCredits(res.data.total_credits || 0);
    } catch (e) {
      console.error('Failed to fetch total credits', e);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await api.get('/subscriptions/me');
      setSubscription(res.data.subscription || null);
    } catch (e) {
      console.error('Failed to fetch subscription', e);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/subscriptions/invoices/me');
      setInvoices(res.data.invoices || []);
    } catch (e) {
      console.error('Failed to fetch invoices', e);
    }
  };

  const handleBuyPackage = async (packageId) => {
    setPurchasing(true);
    setError(''); setSuccess('');
    try {
      const res = await api.post('/credits/purchase', { package_id: packageId });
      setSuccess('Purchase successful');
      setTotalCredits(res.data.total_credits || 0);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to purchase credits');
    } finally {
      setPurchasing(false);
    }
  };

  const handleSaveDetails = async () => {
    setError('');
    setSuccess('');

    // client-side validation
    const payload = { ...(details || {}) };
    const validation = validateProfileFields(payload);
    if (Object.keys(validation).length) {
      setFormErrors(validation);
      setError('Please fix validation errors');
      return;
    }

    try {
      // Build payload ensuring `resumes` is an array of strings
      payload.resumes = (getResumes() || []).map(String);

      // Remove server-managed timestamp fields to avoid MySQL datetime format errors
      delete payload.created_at;
      delete payload.updated_at;

      let res;
      if (details && details.user_id) {
        res = await api.put('/user-details/me', payload);
      } else {
        res = await api.post('/user-details', payload);
      }
      setDetails(res.data);
      setSuccess('Profile details saved successfully');
      setFormErrors({});
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to save profile details');
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom fontWeight="bold">
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* User Info Card */}
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    width: 64, height: 64, borderRadius: '50%', bgcolor: 'primary.main', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '2rem', mr: 2
                  }}
                >
                  {user?.username?.[0]?.toUpperCase()}
                </Box>
                <Box>
                  <Typography variant="h5">{user?.username}</Typography>
                  <Typography color="text.secondary">{user?.email}</Typography>
                  <Typography variant="caption" sx={{ bgcolor: 'primary.light', color: 'white', px: 1, py: 0.5, borderRadius: 1 }}>
                    {user?.role}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Details + Resume Upload Section */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Details
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Box component="form" onSubmit={(e) => { e.preventDefault(); handleSaveDetails(); }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  value={details?.current_role || 'Student'}
                  label="Role"
                  onChange={(e) => setDetails(prev => ({ ...(prev||{}), current_role: e.target.value }))}
                >
                  <MenuItem value="Student">Student</MenuItem>
                  <MenuItem value="Fresher">Fresher</MenuItem>
                  <MenuItem value="Professional">Professional</MenuItem>
                </Select>
              </FormControl>

              <TextField fullWidth label="Full name" sx={{ mb: 2 }} value={details?.full_name || ''} onChange={(e) => setDetails(prev => ({ ...(prev||{}), full_name: e.target.value }))} />
              <TextField fullWidth label="Headline" sx={{ mb: 2 }} value={details?.headline || ''} onChange={(e) => setDetails(prev => ({ ...(prev||{}), headline: e.target.value }))} />
              <TextField fullWidth label="University" sx={{ mb: 2 }} value={details?.university_name || ''} onChange={(e) => setDetails(prev => ({ ...(prev||{}), university_name: e.target.value }))} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="College" value={details?.college_name || ''} onChange={(e) => setDetails(prev => ({ ...(prev||{}), college_name: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Branch" value={details?.branch || ''} onChange={(e) => setDetails(prev => ({ ...(prev||{}), branch: e.target.value }))} />
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Year of passout" value={details?.year_of_passout || ''} error={!!formErrors.year_of_passout} helperText={formErrors.year_of_passout || ''} onChange={(e) => setDetails(prev => ({ ...(prev||{}), year_of_passout: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Contact number" value={details?.contact_number || ''} error={!!formErrors.contact_number} helperText={formErrors.contact_number || ''} onChange={(e) => setDetails(prev => ({ ...(prev||{}), contact_number: e.target.value }))} />
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Location" value={details?.location || ''} onChange={(e) => setDetails(prev => ({ ...(prev||{}), location: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Phone" value={details?.phone || ''} error={!!formErrors.phone} helperText={formErrors.phone || ''} onChange={(e) => setDetails(prev => ({ ...(prev||{}), phone: e.target.value }))} />
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="LinkedIn" value={details?.linkedin || ''} onChange={(e) => setDetails(prev => ({ ...(prev||{}), linkedin: e.target.value }))} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="GitHub" value={details?.github || ''} onChange={(e) => setDetails(prev => ({ ...(prev||{}), github: e.target.value }))} />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                <Button type="submit" variant="contained">{details?.user_id ? 'Update Details' : 'Save Details'}</Button>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Connected Accounts
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Manage connected providers for this account.
            </Typography>

            <Box>
              <Button variant="outlined" onClick={() => { window.location.href = '/connected-accounts'; }}>Manage Connected Accounts</Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <DescriptionIcon sx={{ mr: 1 }} /> Resumes
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Typography variant="subtitle2" gutterBottom>Credits: {totalCredits}</Typography>

            <Box sx={{ mb: 3 }}>
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUploadIcon />}
                disabled={uploading}
              >
                Upload Resume
                <input
                  type="file"
                  hidden
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                />
              </Button>
              {uploading && <CircularProgress size={24} sx={{ ml: 2 }} />}
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Uploaded Files:
            </Typography>

            {resumes.length === 0 ? (
              <Typography color="text.secondary" fontStyle="italic">No resumes uploaded yet.</Typography>
            ) : (
              <List>
                {resumes.map((url, index) => {
                  const fileName = url.split('/').pop().split('_').slice(2).join('_'); // Try to extract original name
                  return (
                    <ListItem key={index} sx={{ bgcolor: 'background.default', mb: 1, borderRadius: 1 }}>
                      <ListItemIcon>
                        <InsertDriveFileIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={fileName || `Resume ${index + 1}`} 
                        secondary={new Date().toLocaleDateString()} // We don't have upload date in the array, just URL
                      />
                      <Button 
                        component="a" 
                        href={`http://localhost:3333${url}`} 
                        target="_blank" 
                        variant="outlined" 
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        View
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteResume(url)}
                        disabled={deleting === url}
                      >
                        {deleting === url ? 'Deleting...' : 'Delete'}
                      </Button>
                    </ListItem>
                  );
                })}
              </List>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Buy Credits
            </Typography>

            {packagesError && <Alert severity="error" sx={{ mb: 2 }}>{packagesError}</Alert>}

            <Box>
              {!creditPackages && !packagesError && <Button variant="outlined" onClick={fetchPackages}>Load credit packages</Button>}
              {creditPackages && creditPackages.length === 0 && <Typography color="text.secondary">No packages available.</Typography>}

              {creditPackages && creditPackages.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {creditPackages.map(pkg => (
                    <Box key={pkg.package_id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1">{pkg.name} — ${((pkg.price_cents||0)/100).toFixed(2)}</Typography>
                        <Typography variant="body2" color="text.secondary">Credits: {pkg.credits}</Typography>
                      </Box>
                      <Box>
                        <Button size="small" variant="contained" onClick={() => handleBuyPackage(pkg.package_id)} disabled={purchasing}>Buy</Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Subscription Section */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Current Subscription
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {subscription ? (
              <Box>
                <Box sx={{ 
                  display: 'inline-block',
                  bgcolor: subscription.plan_name === 'Free' ? 'success.light' : 'primary.light',
                  color: 'white',
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  mb: 2
                }}>
                  <Typography variant="h5" fontWeight="bold">
                    {subscription.plan_name || subscription.plan_type} Plan
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">Price</Typography>
                    <Typography variant="h6">₹{((subscription.price_cents || 0) / 100).toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">Interval</Typography>
                    <Typography variant="h6">{subscription.interval || 'monthly'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">Credits Allocated</Typography>
                    <Typography variant="h6">{subscription.credits_allocated || 0}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Start Date</Typography>
                    <Typography>{new Date(subscription.start_date).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">End Date</Typography>
                    <Typography>{new Date(subscription.end_date).toLocaleDateString()}</Typography>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Typography color="text.secondary">No active subscription</Typography>
            )}
          </Paper>
        </Grid>

        {/* Invoices Section */}
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Invoices
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {invoices.length === 0 ? (
              <Typography color="text.secondary">No invoices available</Typography>
            ) : (
              <List>
                {invoices.map((invoice) => (
                  <ListItem key={invoice.invoice_id} sx={{ bgcolor: 'background.default', mb: 1, borderRadius: 1 }}>
                    <ListItemText
                      primary={`Invoice #${invoice.invoice_number}`}
                      secondary={
                        <>
                          <Typography component="span" variant="body2">
                            Amount: ₹{(invoice.total || 0).toFixed(2)}
                          </Typography>
                          <br />
                          <Typography component="span" variant="body2" color="text.secondary">
                            {new Date(invoice.issued_at).toLocaleDateString()} • {invoice.payment_type || 'N/A'}
                          </Typography>
                        </>
                      }
                    />
                    <Button variant="outlined" size="small">
                      Download
                    </Button>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
