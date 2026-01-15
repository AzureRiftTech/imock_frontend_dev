import { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, CardActions, Button, 
  Chip, Box, CircularProgress, Alert 
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Plans are fetched from backend
let DEFAULT_PLANS = [
  { name: 'Free', price: '$0', credits: 10, features: ['10 Interview Credits', 'Basic Questions', 'Community Support'] }
];

export default function Subscriptions() {
  const { user } = useAuth();
  const [mySubs, setMySubs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchSubscriptions = async () => {
    try {
      const res = await api.get('/subscriptions');
      // Filter for current user since backend returns all
      const userSubs = res.data.filter(sub => sub.user_id === user.user_id);
      setMySubs(userSubs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  function defaultFeaturesFor(plan) {
    const credits = plan.credits_allocated || plan.credits || 0;
    if (plan.name && plan.name.toLowerCase() === 'pro') {
      return [`${credits} Interview Credits`, 'Advanced AI Feedback', 'Priority Support', 'Resume Analysis'];
    }
    if (plan.name && plan.name.toLowerCase() === 'enterprise') {
      return ['Unlimited Credits', 'Custom Models', 'Dedicated Account Manager', 'API Access'];
    }
    return [`${credits || 10} Interview Credits`, 'Basic Questions', 'Community Support'];
  }

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await api.get('/subscriptions/plans');
      const fetched = res.data.plans || [];
      // ensure shapes expected by UI
      const normalized = (fetched.length ? fetched : DEFAULT_PLANS).map(p => ({
        ...p,
        price_cents: p.price_cents || (p.price ? Math.round(parseFloat(String(p.price).replace('$',''))*100) : 0),
        features: p.features || defaultFeaturesFor(p)
      }));
      setPlans(normalized);
    } catch (err) {
      console.error('Failed to fetch plans', err);
      setPlans(DEFAULT_PLANS);
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubscriptions();
    }
    fetchPlans();
  }, [user]);

  const handleSubscribe = async (plan) => {
    setProcessing(true);
    setMessage({ type: '', text: '' });
    try {
      await api.post('/subscriptions/subscribe', { plan_id: plan.plan_id });
      setMessage({ type: 'success', text: `Successfully subscribed to ${plan.name} plan!` });
      fetchSubscriptions();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to subscribe. Please try again.' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading || loadingPlans) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  }

  const activeSub = mySubs.find(s => s.is_active);
  const activePlanName = activeSub ? (plans.find(p => p.plan_id === activeSub.plan_id)?.name || activeSub.plan_type) : null;

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Subscription Plans
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Choose the perfect plan for your interview preparation journey.
      </Typography>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 4 }}>
          {message.text}
        </Alert>
      )}

      {activeSub && (
        <Alert severity="info" sx={{ mb: 4 }} icon={<CheckCircleIcon fontSize="inherit" />}>
          You are currently subscribed to the <strong>{activePlanName}</strong> plan.
          {activePlanName && activePlanName.toLowerCase() === 'free' ? (
            <span> This plan has no expiration date.</span>
          ) : (
            <span> (Expires: {new Date(activeSub.end_date).toLocaleDateString()})</span>
          )}
        </Alert>
      )}

      <Grid container spacing={4}>
        {plans.map((plan) => {
          const isCurrentPlan = activeSub && (activeSub.plan_id === plan.plan_id || activePlanName?.toLowerCase() === plan.name?.toLowerCase());
          return (
          <Grid item key={plan.plan_id || plan.name} xs={12} md={4}>
            <Card 
              elevation={isCurrentPlan ? 8 : (plan.name === 'Pro' ? 6 : 2)} 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                border: isCurrentPlan ? '3px solid' : (plan.name === 'Pro' ? '2px solid' : 'none'),
                borderColor: isCurrentPlan ? 'success.main' : 'primary.main',
                position: 'relative',
                bgcolor: isCurrentPlan ? 'success.light' : 'background.paper',
                opacity: isCurrentPlan ? 1 : 0.95
              }}
            >
              {isCurrentPlan && (
                <Chip 
                  label="YOUR PLAN" 
                  color="success" 
                  size="small" 
                  sx={{ position: 'absolute', top: 16, right: 16, fontWeight: 'bold' }} 
                />
              )}
              {!isCurrentPlan && plan.name === 'Pro' && (
                <Chip 
                  label="POPULAR" 
                  color="primary" 
                  size="small" 
                  sx={{ position: 'absolute', top: 16, right: 16 }} 
                />
              )}

              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography component="h2" variant="h5" color="text.primary" gutterBottom>
                  {plan.name}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', mb: 2 }}>
                  <Typography component="h3" variant="h3" color="text.primary">
                    ${((plan.price_cents||0)/100).toFixed(0)}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    /mo
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'left', mt: 2 }}>
                  {plan.features.map((line) => (
                    <Typography component="p" variant="body1" key={line} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CheckCircleIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                      {line}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
              <CardActions sx={{ p: 2 }}>
                <Button 
                  fullWidth 
                  variant={isCurrentPlan ? 'contained' : (plan.name === 'Pro' ? 'contained' : 'outlined')}
                  color={isCurrentPlan ? 'success' : 'primary'}
                  size="large"
                  onClick={() => handleSubscribe(plan)}
                  disabled={processing || isCurrentPlan}
                >
                  {isCurrentPlan ? 'Current Plan' : 'Subscribe'}
                </Button>
              </CardActions>
            </Card>
          </Grid>
          );
        })}
      </Grid>
    </Container>
  );
}
