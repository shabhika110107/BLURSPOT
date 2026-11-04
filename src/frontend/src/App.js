import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'leaflet/dist/leaflet.css';

import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AuthorityDashboard from './pages/AuthorityDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { authService } from './services/authService';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { 
        main: '#0D9488',
        light: '#14B8A6',
        dark: '#0F766E',
        contrastText: '#FFFFFF'
      },
      secondary: { 
        main: '#1E293B',
        light: '#334155',
        dark: '#0F172A'
      },
      success: {
        main: '#10B981',
        light: '#34D399'
      },
      warning: {
        main: '#F59E0B',
        light: '#FBBF24'
      },
      error: {
        main: '#EF4444',
        light: '#F87171'
      },
      info: {
        main: '#3B82F6',
        light: '#60A5FA'
      },
      background: {
        default: darkMode ? '#0F172A' : '#F1F5F9',
        paper: darkMode ? '#1E293B' : '#FFFFFF'
      },
      text: {
        primary: darkMode ? '#F1F5F9' : '#1F2937',
        secondary: darkMode ? '#94A3B8' : '#4B5563'
      }
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 600, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 }
    },
    shape: { borderRadius: 8 },
    shadows: [
      'none',
      '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
      '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
      '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      ...Array(19).fill('0 25px 50px -12px rgb(0 0 0 / 0.25)')
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '10px 20px',
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'scale(1.02)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: '1px solid #E5E7EB',
            transition: 'all 0.3s ease',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              transition: 'all 0.3s ease',
              '&:hover': { transform: 'scale(1.01)' },
              '&:hover fieldset': { borderColor: '#0D9488' },
              '&.Mui-focused fieldset': { borderColor: '#0D9488', borderWidth: 2 }
            }
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6, fontWeight: 500 }
        }
      }
    }
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
    if (!user) return <Navigate to="/login" />;
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/user/*"
            element={
              <ProtectedRoute allowedRoles={['user']}>
                <UserDashboard user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/authority/*"
            element={
              <ProtectedRoute allowedRoles={['authority']}>
                <AuthorityDashboard user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </ThemeProvider>
  );
}

export default App;
