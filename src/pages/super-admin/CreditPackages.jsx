import { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, Button, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function SACreditPackages() {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [packages, setPackages] = useState([]);
  const [open, setOpen] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'super_admin') return;
    fetch();
  }, [user]);

  const fetch = async () => {
    try {
      const res = await api.get('/super-admin/credit-packages');
      setPackages(res.data || []);
    } catch (err) { console.error('Failed to load credit packages', err); }
  };

  const openCreate = () => { setEditPkg({ name: '', credits: 0, price_cents: 0 }); setOpen(true); };
  const openEdit = (p) => { setEditPkg({ ...p }); setOpen(true); };
  const close = () => { setOpen(false); setEditPkg(null); };

  const save = async () => {
    if (!editPkg) return;
    setSaving(true);
    try {
      if (editPkg.package_id) {
        const res = await api.put(`/super-admin/credit-packages/${editPkg.package_id}`, editPkg);
        setPackages(prev => prev.map(p => p.package_id === res.data.package_id ? res.data : p));
      } else {
        const res = await api.post('/super-admin/credit-packages', editPkg);
        setPackages(prev => [res.data, ...prev]);
      }
      close();
    } catch (err) { console.error('Package save failed', err); setError(err.response?.data?.error || 'Failed to save package'); } finally { setSaving(false); }
  };

  const del = async (id) => { if (!window.confirm('Delete this package?')) return; try { await api.delete(`/super-admin/credit-packages/${id}`); setPackages(prev => prev.filter(p => p.package_id !== id)); } catch (err) { setError(err.response?.data?.error || 'Failed to delete package'); } };

  if (!user) return null;
  if (user.role !== 'super_admin') return (<Container><Paper sx={{p:3}}><Typography variant="h6">Forbidden</Typography><Typography>You do not have access to Super Admin pages.</Typography></Paper></Container>);

  return (
    <Container>
      <Typography variant="h5" sx={{mb:2}}>Credit Packages</Typography>
      {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
      <Paper sx={{p:2}}>
        <Box sx={{display:'flex', justifyContent:'space-between', alignItems:'center', mb:2}}>
          <Typography variant="h6">Credit Packages</Typography>
          <Button variant="contained" onClick={openCreate}>Add Package</Button>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Credits</TableCell>
              <TableCell>Price (cents)</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {packages.map(p => (
              <TableRow key={p.package_id}>
                <TableCell>{p.package_id}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.credits}</TableCell>
                <TableCell>{p.price_cents}</TableCell>
                <TableCell>
                  <IconButton onClick={() => openEdit(p)}><EditIcon /></IconButton>
                  <IconButton onClick={() => del(p.package_id)} color="error"><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle>{editPkg?.package_id ? 'Edit Package' : 'Add Package'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" sx={{mt:1}} value={editPkg?.name||''} onChange={(e)=>setEditPkg(prev=>({...prev, name:e.target.value}))} />
          <TextField fullWidth label="Credits" type="number" sx={{mt:2}} value={editPkg?.credits||0} onChange={(e)=>setEditPkg(prev=>({...prev, credits:Number(e.target.value||0)}))} />
          <TextField fullWidth label="Price (cents)" type="number" sx={{mt:2}} value={editPkg?.price_cents||0} onChange={(e)=>setEditPkg(prev=>({...prev, price_cents:Number(e.target.value||0)}))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button onClick={save} variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
