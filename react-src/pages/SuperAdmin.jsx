import { useEffect, useState } from 'react';
import { Container, Typography, Paper, Box, Button, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Alert, FormControlLabel, Checkbox, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function SuperAdmin() {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [jobCategories, setJobCategories] = useState([]);
  const [plans, setPlans] = useState([]);
  const [creditPackages, setCreditPackages] = useState([]);
  const [credits, setCredits] = useState([]);
  const [activeSection, setActiveSection] = useState('users');

  const [openEdit, setOpenEdit] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [saving, setSaving] = useState(false);

  // job category state
  const [catOpen, setCatOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [catSaving, setCatSaving] = useState(false);

  // plan state
  const [planOpen, setPlanOpen] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [planSaving, setPlanSaving] = useState(false);

  // credit package state
  const [pkgOpen, setPkgOpen] = useState(false);
  const [editPkg, setEditPkg] = useState(null);
  const [pkgSaving, setPkgSaving] = useState(false);

  // per-user subscriptions/credits
  const [subsOpen, setSubsOpen] = useState(false);
  const [subsUser, setSubsUser] = useState(null);
  const [userSubs, setUserSubs] = useState([]);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [creditsUser, setCreditsUser] = useState(null);
  const [userCredits, setUserCredits] = useState([]);
  const [grantAmt, setGrantAmt] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'super_admin') return;
    fetchUsers();
    fetchJobCategories();
    fetchPlans();
    fetchCreditPackages();
    fetchCredits();
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

  const fetchJobCategories = async () => {
    try {
      const res = await api.get('/super-admin/job-categories');
      setJobCategories(res.data || []);
    } catch (err) { console.error('Failed to load categories', err); }
  };

  const fetchPlans = async () => {
    try {
      const res = await api.get('/super-admin/plans');
      setPlans(res.data || []);
    } catch (err) { console.error('Failed to load plans', err); }
  };

  const fetchCreditPackages = async () => {
    try {
      const res = await api.get('/super-admin/credit-packages');
      setCreditPackages(res.data || []);
    } catch (err) { console.error('Failed to load credit packages', err); }
  };

  const fetchCredits = async () => {
    try {
      const res = await api.get('/super-admin/credits');
      setCredits(res.data || []);
    } catch (err) { console.error('Failed to load credits', err); }
  };

  const getUsername = (userId) => {
    const u = users.find(x => x.user_id === userId);
    return u ? u.username : userId;
  };

  // users
  const handleEdit = (u) => { setEditUser({ ...u }); setOpenEdit(true); };
  const handleClose = () => { setOpenEdit(false); setEditUser(null); };
  const openCreateUser = () => { setEditUser({ username: '', email: '', role: 'user', is_active: true }); setOpenEdit(true); };

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
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/super-admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.user_id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const toggleActive = async (u) => {
    try {
      const confirmMsg = u.is_active ? 'Deactivate this user?' : 'Activate this user?';
      if (!window.confirm(confirmMsg)) return;
      const payload = { username: u.username, email: u.email, role: u.role, is_active: !u.is_active };
      const res = await api.put(`/super-admin/users/${u.user_id}`, payload);
      setUsers(prev => prev.map(x => x.user_id === res.data.user_id ? res.data : x));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user status');
    }
  }; 

  // job categories CRUD
  const openCreateCat = () => { setEditCat({ category_name: '', description: '' }); setCatOpen(true); };
  const openEditCat = (c) => { setEditCat({ ...c }); setCatOpen(true); };
  const closeCat = () => { setCatOpen(false); setEditCat(null); };
  const saveCat = async () => {
    if (!editCat) return;
    setCatSaving(true);
    try {
      if (editCat.job_category_id) {
        const res = await api.put(`/super-admin/job-categories/${editCat.job_category_id}`, editCat);
        setJobCategories(prev => prev.map(p => p.job_category_id === res.data.job_category_id ? res.data : p));
      } else {
        const res = await api.post('/super-admin/job-categories', editCat);
        setJobCategories(prev => [res.data, ...prev]);
      }
      closeCat();
    } catch (err) {
      console.error('Category save failed', err);
      setError(err.response?.data?.error || 'Failed to save category');
    } finally { setCatSaving(false); }
  };
  const deleteCat = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/super-admin/job-categories/${id}`);
      setJobCategories(prev => prev.filter(p => p.job_category_id !== id));
    } catch (err) { setError(err.response?.data?.error || 'Failed to delete category'); }
  };

  // plans CRUD
  const openCreatePlan = () => { setEditPlan({ name: '', price_cents: 0, interval: 'monthly', credits_allocated: 0 }); setPlanOpen(true); };
  const openEditPlan = (p) => { setEditPlan({ ...p }); setPlanOpen(true); };
  const closePlan = () => { setPlanOpen(false); setEditPlan(null); };
  const savePlan = async () => {
    if (!editPlan) return;
    setPlanSaving(true);
    try {
      if (editPlan.plan_id) {
        const res = await api.put(`/super-admin/plans/${editPlan.plan_id}`, editPlan);
        setPlans(prev => prev.map(p => p.plan_id === res.data.plan_id ? res.data : p));
      } else {
        const res = await api.post('/super-admin/plans', editPlan);
        setPlans(prev => [res.data, ...prev]);
      }
      closePlan();
    } catch (err) { console.error('Plan save failed', err); setError(err.response?.data?.error || 'Failed to save plan'); } finally { setPlanSaving(false); }
  };
  const deletePlan = async (id) => { if (!window.confirm('Delete this plan?')) return; try { await api.delete(`/super-admin/plans/${id}`); setPlans(prev => prev.filter(p => p.plan_id !== id)); } catch (err) { setError(err.response?.data?.error || 'Failed to delete plan'); } };

  // credit packages CRUD
  const openCreatePkg = () => { setEditPkg({ name: '', credits: 0, price_cents: 0 }); setPkgOpen(true); };
  const openEditPkg = (p) => { setEditPkg({ ...p }); setPkgOpen(true); };
  const closePkg = () => { setPkgOpen(false); setEditPkg(null); };
  const savePkg = async () => { if (!editPkg) return; setPkgSaving(true); try { if (editPkg.package_id) { const res = await api.put(`/super-admin/credit-packages/${editPkg.package_id}`, editPkg); setCreditPackages(prev => prev.map(p => p.package_id === res.data.package_id ? res.data : p)); } else { const res = await api.post('/super-admin/credit-packages', editPkg); setCreditPackages(prev => [res.data, ...prev]); } closePkg(); } catch (err) { console.error('Package save failed', err); setError(err.response?.data?.error || 'Failed to save package'); } finally { setPkgSaving(false); } };
  const deletePkg = async (id) => { if (!window.confirm('Delete this package?')) return; try { await api.delete(`/super-admin/credit-packages/${id}`); setCreditPackages(prev => prev.filter(p => p.package_id !== id)); } catch (err) { setError(err.response?.data?.error || 'Failed to delete package'); } };

  // subscriptions & credits per-user
  const openUserSubs = async (u) => { setSubsUser(u); setSubsOpen(true); try { const res = await api.get(`/super-admin/users/${u.user_id}/subscriptions`); setUserSubs(res.data || []); } catch (err) { setError(err.response?.data?.error || 'Failed to load subscriptions'); } };
  const closeUserSubs = () => { setSubsOpen(false); setSubsUser(null); setUserSubs([]); };
  const createUserSub = async (planId) => { if (!subsUser || !planId) return; try { const res = await api.post(`/super-admin/users/${subsUser.user_id}/subscriptions`, { plan_id: planId }); setUserSubs(prev => [res.data.subscription, ...prev]); fetchUsers(); } catch (err) { setError(err.response?.data?.error || 'Failed to create subscription'); } };

  const openUserCredits = async (u) => { setCreditsUser(u); setCreditsOpen(true); try { const res = await api.get(`/super-admin/users/${u.user_id}/credits`); setUserCredits(res.data || []); } catch (err) { setError(err.response?.data?.error || 'Failed to load credits'); } };
  const closeUserCredits = () => { setCreditsOpen(false); setCreditsUser(null); setUserCredits([]); setGrantAmt(0); };
  const grantCredits = async () => { if (!creditsUser || !grantAmt) return; try { const res = await api.post(`/super-admin/users/${creditsUser.user_id}/credits/grant`, { amount: grantAmt }); setUserCredits(prev => [res.data.credits, ...prev]); fetchUsers(); setGrantAmt(0); } catch (err) { setError(err.response?.data?.error || 'Failed to grant credits'); } };

  if (!user) return null;
  if (user.role !== 'super_admin') return (<Container><Paper sx={{p:3}}><Typography variant="h6">Forbidden</Typography><Typography>You do not have access to Super Admin pages.</Typography></Paper></Container>);

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{mt:2, mb:2}}>Super Admin</Typography>
      {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}

      <Box sx={{display:'flex', gap:2}}>
        <Box sx={{width:220}}>
          <Paper sx={{p:2}}>
            <Typography variant="subtitle1" sx={{mb:1}}>Admin Sections</Typography>
            <Divider sx={{mb:1}} />
            <List>
              <ListItem disablePadding>
                <ListItemButton selected={activeSection === 'users'} onClick={() => { setActiveSection('users'); fetchUsers(); }}>
                  <ListItemIcon><PeopleIcon /></ListItemIcon>
                  <ListItemText primary="Users" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton selected={activeSection === 'plans'} onClick={() => { setActiveSection('plans'); fetchPlans(); }}>
                  <ListItemIcon><LocalOfferIcon /></ListItemIcon>
                  <ListItemText primary="Plans" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton selected={activeSection === 'credit-packages'} onClick={() => { setActiveSection('credit-packages'); fetchCreditPackages(); }}>
                  <ListItemIcon><InventoryIcon /></ListItemIcon>
                  <ListItemText primary="Credit Packages" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton selected={activeSection === 'credits'} onClick={() => { setActiveSection('credits'); fetchCredits(); }}>
                  <ListItemIcon><MonetizationOnIcon /></ListItemIcon>
                  <ListItemText primary="Credits" />
                </ListItemButton>
              </ListItem>
            </List>
          </Paper>
        </Box>

        <Box sx={{flex:1}}>
          {/* Users */}
          {activeSection === 'users' && (
            <Paper sx={{p:2, mb:3}}>
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
                        <Button size="small" onClick={() => openUserCredits(u)} sx={{ml:1}}>Credits</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Plans */}
          {activeSection === 'plans' && (
            <Paper sx={{p:2, mb:3}}>
              <Box sx={{display:'flex', justifyContent:'space-between', alignItems:'center', mb:2}}>
                <Typography variant="h6">Plans</Typography>
                <Button variant="contained" onClick={openCreatePlan}>Add Plan</Button>
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
                        <IconButton onClick={() => openEditPlan(p)}><EditIcon /></IconButton>
                        <IconButton onClick={() => deletePlan(p.plan_id)} color="error"><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Credit Packages */}
          {activeSection === 'credit-packages' && (
            <Paper sx={{p:2, mb:3}}>
              <Box sx={{display:'flex', justifyContent:'space-between', alignItems:'center', mb:2}}>
                <Typography variant="h6">Credit Packages</Typography>
                <Button variant="contained" onClick={openCreatePkg}>Add Package</Button>
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
                  {creditPackages.map(p => (
                    <TableRow key={p.package_id}>
                      <TableCell>{p.package_id}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.credits}</TableCell>
                      <TableCell>{p.price_cents}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => openEditPkg(p)}><EditIcon /></IconButton>
                        <IconButton onClick={() => deletePkg(p.package_id)} color="error"><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}

          {/* Credits */}
          {activeSection === 'credits' && (
            <Paper sx={{p:2, mb:3}}>
              <Box sx={{display:'flex', justifyContent:'space-between', alignItems:'center', mb:2}}>
                <Typography variant="h6">Credits</Typography>
                <Button variant="contained" onClick={fetchCredits}>Refresh</Button>
              </Box>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Subscription</TableCell>
                    <TableCell>Credits</TableCell>
                    <TableCell>Updated</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {credits.map(c => (
                    <TableRow key={c.credit_id}>
                      <TableCell>{c.credit_id}</TableCell>
                      <TableCell>{getUsername(c.user_id)}</TableCell>
                      <TableCell>{c.subscription_id || '-'}</TableCell>
                      <TableCell>{c.current_credits}</TableCell>
                      <TableCell>{c.updated_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Dialogs */}
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

      <Dialog open={catOpen} onClose={closeCat} fullWidth maxWidth="sm">
        <DialogTitle>{editCat?.job_category_id ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" sx={{mt:1}} value={editCat?.category_name||''} onChange={(e)=>setEditCat(prev=>({...prev, category_name:e.target.value}))} />
          <TextField fullWidth label="Description" sx={{mt:2}} value={editCat?.description||''} onChange={(e)=>setEditCat(prev=>({...prev, description:e.target.value}))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCat}>Cancel</Button>
          <Button onClick={saveCat} variant="contained" disabled={catSaving}>{catSaving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={planOpen} onClose={closePlan} fullWidth maxWidth="sm">
        <DialogTitle>{editPlan?.plan_id ? 'Edit Plan' : 'Add Plan'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" sx={{mt:1}} value={editPlan?.name||''} onChange={(e)=>setEditPlan(prev=>({...prev, name:e.target.value}))} />
          <TextField fullWidth label="Price (cents)" type="number" sx={{mt:2}} value={editPlan?.price_cents||0} onChange={(e)=>setEditPlan(prev=>({...prev, price_cents:Number(e.target.value||0)}))} />
          <TextField fullWidth label="Interval" sx={{mt:2}} value={editPlan?.interval||'monthly'} onChange={(e)=>setEditPlan(prev=>({...prev, interval:e.target.value}))} />
          <TextField fullWidth label="Credits Allocated" type="number" sx={{mt:2}} value={editPlan?.credits_allocated||0} onChange={(e)=>setEditPlan(prev=>({...prev, credits_allocated:Number(e.target.value||0)}))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closePlan}>Cancel</Button>
          <Button onClick={savePlan} variant="contained" disabled={planSaving}>{planSaving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={pkgOpen} onClose={closePkg} fullWidth maxWidth="sm">
        <DialogTitle>{editPkg?.package_id ? 'Edit Package' : 'Add Package'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name" sx={{mt:1}} value={editPkg?.name||''} onChange={(e)=>setEditPkg(prev=>({...prev, name:e.target.value}))} />
          <TextField fullWidth label="Credits" type="number" sx={{mt:2}} value={editPkg?.credits||0} onChange={(e)=>setEditPkg(prev=>({...prev, credits:Number(e.target.value||0)}))} />
          <TextField fullWidth label="Price (cents)" type="number" sx={{mt:2}} value={editPkg?.price_cents||0} onChange={(e)=>setEditPkg(prev=>({...prev, price_cents:Number(e.target.value||0)}))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closePkg}>Cancel</Button>
          <Button onClick={savePkg} variant="contained" disabled={pkgSaving}>{pkgSaving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={subsOpen} onClose={closeUserSubs} fullWidth maxWidth="md">
        <DialogTitle>Subscriptions for {subsUser?.username}</DialogTitle>
        <DialogContent>
          <Box sx={{display:'flex', gap:2, mb:2}}>
            <TextField select label="Plan" SelectProps={{ native:true }} value={''} onChange={(e)=>createUserSub(Number(e.target.value))}>
              <option value="">Choose plan to create</option>
              {plans.map(p => (<option key={p.plan_id} value={p.plan_id}>{p.name}</option>))}
            </TextField>
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

      <Dialog open={creditsOpen} onClose={closeUserCredits} fullWidth maxWidth="md">
        <DialogTitle>Credits for {creditsUser?.username}</DialogTitle>
        <DialogContent>
          <Box sx={{display:'flex', gap:2, mb:2}}>
            <TextField label="Amount" type="number" value={grantAmt} onChange={(e)=>setGrantAmt(Number(e.target.value||0))} />
            <Button variant="contained" onClick={grantCredits}>Grant</Button>
          </Box>
          <Table>
            <TableHead>
              <TableRow><TableCell>ID</TableCell><TableCell>Credits</TableCell><TableCell>Updated</TableCell></TableRow>
            </TableHead>
            <TableBody>
              {userCredits.map(c => (<TableRow key={c.credit_id}><TableCell>{c.credit_id}</TableCell><TableCell>{c.current_credits}</TableCell><TableCell>{c.updated_at}</TableCell></TableRow>))}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={closeUserCredits}>Close</Button></DialogActions>
      </Dialog>

    </Container>
  );
}
