import { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, Button, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Alert, FormControlLabel, Checkbox } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function SAUsers() {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [openEdit, setOpenEdit] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/super-admin/plans');
      setPlans(res.data || []);
    } catch (err) { console.error('Failed to load plans', err); }
  };

  useEffect(() => {
    if (!user || user.role !== 'super_admin') return;
    fetchUsers();
    fetchPlans();
  }, [user]);

  const fetchUsers = async () => {
    setError('');
    try {
      const res = await api.get('/super-admin/users');
      setUsers(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    }
  };

  const openCreateUser = () => { setEditUser({ username: '', email: '', role: 'user', is_active: true }); setOpenEdit(true); };
  const handleEdit = (u) => { setEditUser({ ...u }); setOpenEdit(true); };
  const handleClose = () => { setOpenEdit(false); setEditUser(null); };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true); setError('');
    try {
      const payload = { username: editUser.username, email: editUser.email, role: editUser.role, is_active: !!editUser.is_active };
      if (editUser.user_id) {
        const res = await api.put(`/super-admin/users/${editUser.user_id}`, payload);
        setUsers(prev => prev.map(u => u.user_id === res.data.user_id ? res.data : u));
      } else {
        const res = await api.post('/super-admin/users', payload);
        setUsers(prev => [res.data, ...prev]);
      }
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save user');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!(await sweetConfirm('Delete this user?'))) return;
    try {
      await api.delete(`/super-admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.user_id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  // Subscriptions for a user
  const [subsOpen, setSubsOpen] = useState(false);
  const [subsUser, setSubsUser] = useState(null);
  const [userSubs, setUserSubs] = useState([]);
  const [newPlanId, setNewPlanId] = useState('');
  const [adminAllocate, setAdminAllocate] = useState(false);

  const openUserSubs = async (u) => { setSubsUser(u); setSubsOpen(true); try { const res = await api.get(`/super-admin/users/${u.user_id}/subscriptions`); setUserSubs(res.data || []); } catch (err) { setError(err.response?.data?.error || 'Failed to load subscriptions'); } };
  const closeUserSubs = () => { setSubsOpen(false); setSubsUser(null); setUserSubs([]); setNewPlanId(''); setAdminAllocate(false); };
  const createUserSub = async () => { if (!subsUser || !newPlanId) return; try { const res = await api.post(`/super-admin/users/${subsUser.user_id}/subscriptions`, { plan_id: Number(newPlanId), admin_allocate: adminAllocate }); setUserSubs(prev => [res.data.subscription, ...prev]); fetchUsers(); setNewPlanId(''); setAdminAllocate(false); } catch (err) { setError(err.response?.data?.error || 'Failed to create subscription'); } };

  const toggleActive = async (u) => {
    try {
      const confirmMsg = u.is_active ? 'Deactivate this user?' : 'Activate this user?';
      if (!(await sweetConfirm(confirmMsg))) return;
      const payload = { username: u.username, email: u.email, role: u.role, is_active: !u.is_active };
      const res = await api.put(`/super-admin/users/${u.user_id}`, payload);
      setUsers(prev => prev.map(x => x.user_id === res.data.user_id ? res.data : x));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user status');
    }
  };

  if (!user) return null;
  if (user.role !== 'super_admin') return (<Container><Paper sx={{p:3}}><Typography variant="h6">Forbidden</Typography><Typography>You do not have access to Super Admin pages.</Typography></Paper></Container>);

  return (
    <Container>
      <Typography variant="h5" sx={{mb:2}}>Users</Typography>
      {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
      <Paper sx={{p:2}}>
        <Box sx={{display:'flex', justifyContent:'space-between', alignItems:'center', mb:2}}>
          <Typography variant="h6">Users</Typography>
          <Button variant="contained" onClick={openCreateUser}>Add User</Button>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map(u => (
              <TableRow key={u.user_id}>
                <TableCell>{u.user_id}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{u.is_active ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(u)}><EditIcon /></IconButton>
                  <IconButton onClick={() => handleDelete(u.user_id)} color="error"><DeleteIcon /></IconButton>
                  <Button size="small" onClick={() => toggleActive(u)} sx={{ml:1}} color={u.is_active ? 'warning' : 'success'}>{u.is_active ? 'Deactivate' : 'Activate'}</Button>
                  <Button size="small" onClick={() => openUserSubs(u)} sx={{ml:1}}>Subscriptions</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={openEdit} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{editUser?.user_id ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Username" sx={{mt:1}} value={editUser?.username||''} onChange={(e)=>setEditUser(prev=>({...prev, username:e.target.value}))} />
          <TextField fullWidth label="Email" sx={{mt:2}} value={editUser?.email||''} onChange={(e)=>setEditUser(prev=>({...prev, email:e.target.value}))} />
          <TextField fullWidth label="Role" sx={{mt:2}} value={editUser?.role||''} onChange={(e)=>setEditUser(prev=>({...prev, role:e.target.value}))} />
          <FormControlLabel sx={{mt:2}} control={<Checkbox checked={!!editUser?.is_active} onChange={(e)=>setEditUser(prev=>({...prev, is_active:e.target.checked}))} />} label="Active" />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Subscriptions dialog */}
      <Dialog open={subsOpen} onClose={closeUserSubs} fullWidth maxWidth="md">
        <DialogTitle>Subscriptions for {subsUser?.username}</DialogTitle>
        <DialogContent>
          <Box sx={{display:'flex', gap:2, mb:2}}>
            <TextField select label="Plan" SelectProps={{ native:true }} value={newPlanId} onChange={(e)=>setNewPlanId(e.target.value)}>
              <option value="">Choose plan to create</option>
              {plans.map(p => (<option key={p.plan_id} value={p.plan_id}>{p.name}</option>))}
            </TextField>
            <FormControlLabel control={<Checkbox checked={adminAllocate} onChange={(e)=>setAdminAllocate(e.target.checked)} />} label="Admin allocate (no charge)" />
            <Button variant="contained" onClick={createUserSub}>Create</Button>
          </Box>

          <Table>
            <TableHead>
              <TableRow><TableCell>ID</TableCell><TableCell>Plan</TableCell><TableCell>Start</TableCell><TableCell>End</TableCell><TableCell>Active</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {userSubs.map(s => (<TableRow key={s.subscription_id}><TableCell>{s.subscription_id}</TableCell><TableCell>{s.plan_name}</TableCell><TableCell>{s.start_date}</TableCell><TableCell>{s.end_date}</TableCell><TableCell>{s.is_active ? 'Yes' : 'No'}</TableCell></TableRow>))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={closeUserSubs}>Close</Button></DialogActions>
      </Dialog>
    </Container>
  );
}
