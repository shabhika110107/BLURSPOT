import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Paper, TextField, Button, Typography, Box, Alert, CircularProgress, Stepper, Step, StepLabel } from '@mui/material';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';

function Register() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.register(formData);
      toast.success('OTP sent to your email and phone!');
      setActiveStep(1);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.verifyOTP(formData.email, otp);
      toast.success('Account verified successfully!');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed');
      toast.error(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authService.resendOTP(formData.email);
      toast.success('OTP resent!');
    } catch (err) {
      toast.error('Failed to resend OTP');
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
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#1F2937' }}>Register - BlurSpot</Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ my: 3, '& .MuiStepLabel-label': { fontWeight: 500 }, '& .MuiStepIcon-root.Mui-active': { color: '#0D9488' }, '& .MuiStepIcon-root.Mui-completed': { color: '#10B981' } }}>
            <Step><StepLabel>Register</StepLabel></Step>
            <Step><StepLabel>Verify OTP</StepLabel></Step>
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          {activeStep === 0 ? (
            <form onSubmit={handleRegister}>
              <TextField fullWidth label="Full Name" name="name" value={formData.name} onChange={handleChange} margin="normal" required sx={{ mb: 1.5 }} />
              <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} margin="normal" required sx={{ mb: 1.5 }} />
              <TextField fullWidth label="Phone" name="phone" value={formData.phone} onChange={handleChange} margin="normal" required sx={{ mb: 1.5 }} />
              <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} margin="normal" required sx={{ mb: 1.5 }} />
              <TextField fullWidth label="Password" name="password" type="password" value={formData.password} onChange={handleChange} margin="normal" required sx={{ mb: 1.5 }} />
              <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} margin="normal" required sx={{ mb: 2 }} />
              <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ py: 1.5, background: '#0D9488', '&:hover': { background: '#0F766E' } }}>
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Register'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2, background: '#DBEAFE' }}><Typography variant="body2" sx={{ fontWeight: 500 }}>Enter the OTP sent to your email and phone</Typography></Alert>
              <TextField fullWidth label="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} margin="normal" required sx={{ mb: 2 }} />
              <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ py: 1.5, background: '#0D9488', '&:hover': { background: '#0F766E' } }}>
                {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Verify OTP'}
              </Button>
              <Button fullWidth variant="text" sx={{ mt: 1.5, color: '#0D9488', fontWeight: 600, '&:hover': { background: 'rgba(13, 148, 136, 0.05)' } }} onClick={handleResendOTP}>Resend OTP</Button>
            </form>
          )}

          <Box textAlign="center" sx={{ mt: 3 }}>
            <Typography variant="body2" sx={{ color: '#4B5563' }}>Already have an account? <Link to="/login" style={{ color: '#0D9488', fontWeight: 600, textDecoration: 'none' }}>Login</Link></Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default Register;
