import { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, Button, Grid, TextField, Alert, CircularProgress, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Divider, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Interviews() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [company_name, setCompanyName] = useState('');
  const [scheduled_at, setScheduledAt] = useState(''); // datetime-local
  const [category_name, setCategoryName] = useState('');
  const [position, setPosition] = useState('');
  const [experience_required, setExperienceRequired] = useState('');
  const [job_description, setJobDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // categories
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [openAddCategory, setOpenAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editInterview, setEditInterview] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchInterviews = async () => {
    setLoading(true);
    setError('');
    try {
      // fetch only user's interviews
      const res = await api.get('/interviews', { params: { user_id: user?.user_id } });
      setInterviews(res.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await api.get('/interviews/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    try {
      const res = await api.post('/interviews/categories', { category_name: newCategoryName.trim(), description: newCategoryDescription.trim() || null });
      // server returns created or existing category
      const cat = res.data;
      // refresh list and select new
      await fetchCategories();
      setCategoryName(cat.category_name);
      setOpenAddCategory(false);
      setNewCategoryName(''); setNewCategoryDescription('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to add category');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!company_name || !scheduled_at || !position) {
      setError('Company, scheduled time and position are required');
      return;
    }
    setSaving(true);
    try {
      const payload = { company_name, scheduled_at, position, experience_required, job_description, category_name };
      const res = await api.post('/interviews', payload);
      setInterviews(prev => [res.data, ...prev]);
      setCompanyName(''); setScheduledAt(''); setCategoryName(''); setPosition(''); setExperienceRequired(''); setJobDescription('');
      setSuccess('Interview added');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to add interview');
    } finally {
      setSaving(false);
    }
  };

  // Edit handlers
  const handleOpenEdit = (iv) => {
    setEditInterview({ ...iv });
    setEditOpen(true);
    setError(''); setSuccess('');
  };

  const handleCloseEdit = () => {
    setEditInterview(null);
    setEditOpen(false);
  };

  const handleSaveEdit = async () => {
    if (!editInterview) return;
    setSavingEdit(true);
    setError(''); setSuccess('');
    try {
      const payload = {
        company_name: editInterview.company_name,
        scheduled_at: editInterview.scheduled_at,
        position: editInterview.position_name || editInterview.position,
        experience_required: editInterview.experience_required,
        job_description: editInterview.job_description,
        category_name: editInterview.category_name,
      };
      const res = await api.put(`/interviews/${editInterview.interview_id}`, payload);
      setInterviews(prev => prev.map(it => it.interview_id === res.data.interview_id ? res.data : it));
      setSuccess('Interview updated');
      handleCloseEdit();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to update interview');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await sweetConfirm('Delete this interview?'))) return;
    setDeleting(id);
    setError(''); setSuccess('');
    try {
      await api.delete(`/interviews/${id}`);
      setInterviews(prev => prev.filter(i => i.interview_id !== id));
      setSuccess('Interview deleted');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to delete interview');
    } finally {
      setDeleting(null);
    }
  };

  // Helpers: parse date strings robustly and split into upcoming/past relative to now
  const parseDate = (s) => {
    if (!s) return new Date(0);
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d;
    // fallback: try replacing space with 'T' to form ISO-like string
    const d2 = new Date(String(s).replace(' ', 'T'));
    return d2;
  };

  const now = new Date();
  const upcoming = (interviews || []).filter(iv => parseDate(iv.scheduled_at) >= now)
    .sort((a, b) => parseDate(a.scheduled_at) - parseDate(b.scheduled_at));
  const past = (interviews || []).filter(iv => parseDate(iv.scheduled_at) < now)
    .sort((a, b) => parseDate(b.scheduled_at) - parseDate(a.scheduled_at));

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom fontWeight="bold">Interviews</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Add Interview</Typography>
        <Box component="form" onSubmit={handleAdd}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Company" fullWidth value={company_name} onChange={(e) => setCompanyName(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Scheduled at" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={scheduled_at} onChange={(e) => setScheduledAt(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField select label="Category" fullWidth value={category_name} onChange={(e) => setCategoryName(e.target.value)} helperText="Job category (select or add new)">
                <MenuItem value="">None</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.job_category_id} value={c.category_name}>{c.category_name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button variant="outlined" size="small" onClick={() => setOpenAddCategory(true)}>Add</Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Position" fullWidth value={position} onChange={(e) => setPosition(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Experience required" fullWidth value={experience_required} onChange={(e) => setExperienceRequired(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Job description" fullWidth multiline minRows={3} value={job_description} onChange={(e) => setJobDescription(e.target.value)} />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Add Interview'}</Button>
          </Box>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Upcoming / Past Interviews</Typography>
        {interviews.length === 0 ? (
          <Typography color="text.secondary">No interviews found.</Typography>
        ) : (
          <>
            <Typography variant="h6" sx={{ mb: 1 }}>Upcoming Interviews ({upcoming.length})</Typography>
            {upcoming.length === 0 ? (
              <Typography color="text.secondary" sx={{ mb: 2 }}>No upcoming interviews.</Typography>
            ) : (
              <List>
                {upcoming.map((iv) => (
                  <ListItem key={iv.interview_id} divider>
                    <ListItemText
                      primary={`${iv.company_name} — ${iv.position_name || iv.position || ''}`}
                      secondary={(iv.category_name ? `${iv.category_name} · ` : '') + (parseDate(iv.scheduled_at).toLocaleString())}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" color="primary" onClick={() => handleOpenEdit(iv)} sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" color="error" onClick={() => handleDelete(iv.interview_id)} disabled={deleting === iv.interview_id}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 1 }}>Past Interviews ({past.length})</Typography>
            {past.length === 0 ? (
              <Typography color="text.secondary">No past interviews.</Typography>
            ) : (
              <List>
                {past.map((iv) => (
                  <ListItem key={iv.interview_id} divider>
                    <ListItemText
                      primary={`${iv.company_name} — ${iv.position_name || iv.position || ''}`}
                      secondary={(iv.category_name ? `${iv.category_name} · ` : '') + (parseDate(iv.scheduled_at).toLocaleString())}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" color="primary" onClick={() => handleOpenEdit(iv)} sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton edge="end" color="error" onClick={() => handleDelete(iv.interview_id)} disabled={deleting === iv.interview_id}>
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </Paper>

      <Dialog open={editOpen} onClose={handleCloseEdit} fullWidth maxWidth="sm">
        <DialogTitle>Edit Interview</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <TextField label="Company" fullWidth value={editInterview?.company_name || ''} onChange={(e) => setEditInterview(prev => ({ ...(prev||{}), company_name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Scheduled at" type="datetime-local" fullWidth InputLabelProps={{ shrink: true }} value={editInterview?.scheduled_at ? new Date(editInterview.scheduled_at).toISOString().slice(0,16) : ''} onChange={(e) => setEditInterview(prev => ({ ...(prev||{}), scheduled_at: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField select label="Category" fullWidth value={editInterview?.category_name || ''} onChange={(e) => setEditInterview(prev => ({ ...(prev||{}), category_name: e.target.value }))} helperText="Job category">
                <MenuItem value="">None</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.job_category_id} value={c.category_name}>{c.category_name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={1} sx={{ display: 'flex', alignItems: 'center' }}>
              <Button variant="outlined" size="small" onClick={() => setOpenAddCategory(true)}>Add</Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Position" fullWidth value={editInterview?.position_name || editInterview?.position || ''} onChange={(e) => setEditInterview(prev => ({ ...(prev||{}), position_name: e.target.value }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Experience required" fullWidth value={editInterview?.experience_required || ''} onChange={(e) => setEditInterview(prev => ({ ...(prev||{}), experience_required: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Job description" fullWidth multiline minRows={3} value={editInterview?.job_description || ''} onChange={(e) => setEditInterview(prev => ({ ...(prev||{}), job_description: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={savingEdit}>{savingEdit ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openAddCategory} onClose={() => setOpenAddCategory(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Job Category</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Description" multiline minRows={3} value={newCategoryDescription} onChange={(e) => setNewCategoryDescription(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddCategory(false)}>Cancel</Button>
          <Button onClick={handleAddCategory} variant="contained" disabled={addingCategory}>{addingCategory ? 'Adding...' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
