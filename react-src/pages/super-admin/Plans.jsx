import { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, Button, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function SAPlans() {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [plans, setPlans] = useState([]);
  const [open, setOpen] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'super_admin') return;
    fetchPlans();
  }, [user]);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/super-admin/plans');
      setPlans(res.data || []);
    } catch (err) { console.error('Failed to load plans', err); }
  };

  const openCreate = () => { setEditPlan({ name: '', price_cents: 0, interval: 'monthly', credits_allocated: 0 }); setOpen(true); };
  const openEdit = (p) => { setEditPlan({ ...p }); setOpen(true); };
  const close = () => { setOpen(false); setEditPlan(null); };

  const save = async () => {
    if (!editPlan) return;
    setSaving(true);
    try {
      if (editPlan.plan_id) {
        const res = await api.put(`/super-admin/plans/${editPlan.plan_id}`, editPlan);
        setPlans(prev => prev.map(p => p.plan_id === res.data.plan_id ? res.data : p));
      } else {
        const res = await api.post('/super-admin/plans', editPlan);
        setPlans(prev => [res.data, ...prev]);
      }
      close();
    } catch (err) { console.error('Plan save failed', err); setError(err.response?.data?.error || 'Failed to save plan'); } finally { setSaving(false); }
  };

  const del = async (id) => { if (!window.confirm('Delete this plan?')) return; try { await api.delete(`/super-admin/plans/${id}`); setPlans(prev => prev.filter(p => p.plan_id !== id)); } catch (err) { setError(err.response?.data?.error || 'Failed to delete plan'); } };

  if (!user) return null;
  if (user.role !== 'super_admin') return (<Container><Paper sx={{p:3}}><Typography variant="h6">Forbidden</Typography><Typography>You do not have access to Super Admin pages.</Typography></Paper></Container>);

  return (
    <Container>
      <Typography variant="h5" sx={{mb:2}}>Plans</Typography>
      {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
      <Paper sx={{p:2}}>
        <Box sx={{display:'flex', justifyContent:'space-between', alignItems:'center', mb:2}}>
          <Typography variant="h6">Plans</Typography>
          <Button variant="contained" onClick={openCreate}>Add Plan</Button>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Price (cents)</TableCell>
              <TableCell>Interval</TableCell>
              <TableCell>Credits</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {plans.map(p => (
              <TableRow key={p.plan_id}>
                <TableCell>{p.plan_id}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.price_cents}</TableCell>
                <TableCell>{p.interval}</TableCell>
                <TableCell>{p.credits_allocated}</TableCell>
                <TableCell>
                  <IconButton onClick={() => openEdit(p)}><EditIcon /></IconButton>
                  <IconButton onClick={() => del(p.plan_id)} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle>{editPlan?.plan_id ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" sx={{mt:1}} value={editPlan?.name||''} onChange={(e)=>setEditPlan(prev=>({...prev, name:e.target.value}))} />
          <TextField fullWidth label="Price (cents)" type="number" sx={{mt:2}} value={editPlan?.price_cents||0} onChange={(e)=>setEditPlan(prev=>({...prev, price_cents:Number(e.target.value||0)}))} />
          <TextField fullWidth label="Interval" sx={{mt:2}} value={editPlan?.interval||'monthly'} onChange={(e)=>setEditPlan(prev=>({...prev, interval:e.target.value}))} />
          <TextField fullWidth label="Credits Allocated" type="number" sx={{mt:2}} value={editPlan?.credits_allocated||0} onChange={(e)=>setEditPlan(prev=>({...prev, credits_allocated:Number(e.target.value||0)}))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button onClick={save} variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
