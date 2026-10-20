import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Box, Alert, CircularProgress, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login(formData.username, formData.password, role);
      onLogin(response.user);
      toast.success('Login successful!');
      
      // Navigate based on role
      if (response.user.role === 'admin') {
        navigate('/admin');
      } else if (response.user.role === 'authority') {
        navigate('/authority');
      } else {
        navigate('/user');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#F1F5F9', display: 'flex', alignItems: 'center', py: 4 }}>
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 5, borderRadius: 3, border: '1px solid #E5E7EB' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', background: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 10px 25px rgba(13, 148, 136, 0.3)' }}>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>B</Typography>
            </Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#1F2937' }}>BlurSpot</Typography>
            <Typography variant="body1" sx={{ color: '#4B5563', fontWeight: 500 }}>Civic Issue Reporting Platform</Typography>
          </Box>

          <Box sx={{ my: 3 }}>
            <ToggleButtonGroup value={role} exclusive onChange={(e, val) => val && setRole(val)} fullWidth sx={{ '& .MuiToggleButton-root': { py: 1.5, fontWeight: 600, borderRadius: 2, transition: 'all 0.3s ease', '&.Mui-selected': { background: '#0D9488', color: 'white', '&:hover': { background: '#0F766E' } } } }}>
              <ToggleButton value="user">User</ToggleButton>
              <ToggleButton value="authority">Authority</ToggleButton>
              <ToggleButton value="admin">Admin</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField fullWidth label={role === 'user' ? 'Email' : 'Username'} name="username" value={formData.username} onChange={handleChange} margin="normal" required sx={{ mb: 2 }} />
            <TextField fullWidth label="Password" name="password" type="password" value={formData.password} onChange={handleChange} margin="normal" required sx={{ mb: 3 }} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ py: 1.5, background: '#0D9488', '&:hover': { background: '#0F766E' } }}>
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Sign In'}
            </Button>
          </form>

          {role === 'user' && (
            <Box textAlign="center" sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ color: '#4B5563' }}>Don't have an account? <Link to="/register" style={{ color: '#0D9488', fontWeight: 600, textDecoration: 'none' }}>Register</Link></Typography>
            </Box>
          )}

          {role === 'admin' && <Alert severity="info" sx={{ mt: 3, borderRadius: 2, background: '#DBEAFE' }}><Typography variant="body2" sx={{ fontWeight: 500 }}>Default: admin / securepass</Typography></Alert>}
          {role === 'authority' && <Alert severity="info" sx={{ mt: 3, borderRadius: 2, background: '#DBEAFE' }}><Typography variant="body2" sx={{ fontWeight: 500 }}>Default: authority1 / auth123</Typography></Alert>}
        </Paper>
      </Container>
    </Box>
  );
}

export default Login;
