import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from './theme';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ConnectedAccounts from './pages/ConnectedAccounts';
import Subscriptions from './pages/Subscriptions';
import VerifyEmail from './pages/VerifyEmail';
import UserDetails from './pages/UserDetails';
import CVUpload from './pages/CVUpload';
import Interviews from './pages/Interviews';
import SuperAdminIndex from './pages/super-admin';
import SAUsers from './pages/super-admin/Users';
import SAPlans from './pages/super-admin/Plans';
import SACreditPackages from './pages/super-admin/CreditPackages';
import SACredits from './pages/super-admin/Credits';
import ProtectedRoute from './components/ProtectedRoute';
import MockInterview from './pages/MockInterview';
import { useState, useMemo } from 'react';

function App() {
  // You can add logic here to toggle mode or persist it in localStorage
  const [mode, setMode] = useState('light'); 
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/connected-accounts" element={<ConnectedAccounts />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/user-details" element={<CVUpload />} />
                <Route path="/cv" element={<CVUpload />} />
                <Route path="/interviews" element={<Interviews />} />
                <Route path="/mock-interview" element={<MockInterview />} />
                <Route path="/super-admin" element={<SuperAdminIndex />}>
                  <Route index element={<Navigate to="users" />} />
                  <Route path="users" element={<SAUsers />} />
                  <Route path="plans" element={<SAPlans />} />
                  <Route path="credit-packages" element={<SACreditPackages />} />
                  <Route path="credits" element={<SACredits />} />
                </Route>
                {/* Add other protected routes here */}
                <Route path="*" element={<Navigate to="/" />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
