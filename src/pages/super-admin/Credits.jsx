import { useEffect, useState } from 'react';
import { Container, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function SACredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'super_admin') return;
    fetchCredits();
    fetchUsers();
  }, [user]);

  const fetchCredits = async () => {
    try {
      const res = await api.get('/super-admin/credits');
      setCredits(res.data || []);
    } catch (err) { console.error('Failed to load credits', err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/super-admin/users');
      setUsers(res.data || []);
    } catch (err) { console.error(err); }
  };

  const getUsername = (userId) => {
    const u = users.find(x => x.user_id === userId);
    return u ? u.username : userId;
  };

  if (!user) return null;
  if (user.role !== 'super_admin') return (<Container><Paper sx={{p:3}}><Typography variant="h6">Forbidden</Typography><Typography>You do not have access to Super Admin pages.</Typography></Paper></Container>);

  return (
    <Container>
      <Typography variant="h5" sx={{mb:2}}>Credits</Typography>
      <Paper sx={{p:2}}>
        <Button variant="contained" onClick={fetchCredits} sx={{mb:2}}>Refresh</Button>
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
    </Container>
  );
}
