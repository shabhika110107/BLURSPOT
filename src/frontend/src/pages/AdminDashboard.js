import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemIcon, ListItemText, IconButton, Switch } from '@mui/material';
import { Menu as MenuIcon, Dashboard, People, Report, Logout, DarkMode } from '@mui/icons-material';
import AdminStats from '../components/AdminStats';
import AdminUsers from '../components/AdminUsers';
import AdminReports from '../components/AdminReports';

const drawerWidth = 240;

function AdminDashboard({ user, onLogout, darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
    { text: 'Users', icon: <People />, path: '/admin/users' },
    { text: 'Reports', icon: <Report />, path: '/admin/reports' }
  ];

  const drawer = (
    <Box sx={{ height: '100%', background: '#1E293B' }}>
      <Toolbar sx={{ background: '#0F172A', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Box sx={{ width: 40, height: 40, borderRadius: '50%', background: '#0D9488', display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2 }}>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>B</Typography>
        </Box>
        <Typography variant="h6" noWrap sx={{ color: '#E5E7EB', fontWeight: 700 }}>BlurSpot Admin</Typography>
      </Toolbar>
      <List sx={{ px: 2, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem button key={item.text} onClick={() => navigate(item.path)} sx={{ borderRadius: 2, mb: 1, color: '#E5E7EB', transition: 'all 0.3s ease', '&:hover': { background: 'rgba(13, 148, 136, 0.2)', transform: 'translateX(4px)' } }}>
            <ListItemIcon sx={{ color: '#E5E7EB', minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: 500 }} />
          </ListItem>
        ))}
        <ListItem sx={{ mt: 2, borderRadius: 2, background: 'rgba(255, 255, 255, 0.05)' }}>
          <ListItemIcon sx={{ color: '#E5E7EB', minWidth: 40 }}><DarkMode /></ListItemIcon>
          <Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#0D9488' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#0D9488' } }} />
        </ListItem>
        <ListItem button onClick={onLogout} sx={{ borderRadius: 2, mt: 1, color: '#E5E7EB', transition: 'all 0.3s ease', '&:hover': { background: 'rgba(239, 68, 68, 0.2)', transform: 'translateX(4px)' } }}>
          <ListItemIcon sx={{ color: '#E5E7EB', minWidth: 40 }}><Logout /></ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 500 }} />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background: '#1E293B', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>Admin Dashboard</Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
      >
        {drawer}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{ 
          display: { xs: 'none', sm: 'block' }, 
          '& .MuiDrawer-paper': { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            position: 'fixed',
            height: '100vh',
            top: 0,
            left: 0
          } 
        }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, ml: { sm: `${drawerWidth}px` }, background: '#F1F5F9', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<AdminStats />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/reports" element={<AdminReports />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default AdminDashboard;
