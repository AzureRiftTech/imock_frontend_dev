import { Typography, Grid, Paper, Box } from '@mui/material';

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Recent Activity
            </Typography>
            <Typography component="p" variant="h4">
              0
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              interviews completed
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Upcoming Interviews
            </Typography>
            <Typography component="p" variant="h4">
              0
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              scheduled
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
              Performance Score
            </Typography>
            <Typography component="p" variant="h4">
              N/A
            </Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>
              average score
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
