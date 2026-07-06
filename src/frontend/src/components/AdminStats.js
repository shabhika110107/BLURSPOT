import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, LinearProgress, Chip } from '@mui/material';
import { People, Report, CheckCircle, Warning, TrendingUp, Speed, Notifications, Business } from '@mui/icons-material';
import axios from 'axios';
import { authService } from '../services/authService';

function AdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/admin/stats`,
        {
          headers: { Authorization: `Bearer ${authService.getToken()}` }
        }
      );
      setStats(response.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}><CircularProgress sx={{ color: '#0D9488' }} /></Box>);
  if (!stats) return <Typography>No data available</Typography>;

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: <People />, color: '#0D9488', bgColor: '#D1FAE5' },
    { title: 'Total Reports', value: stats.totalReports, icon: <Report />, color: '#1E293B', bgColor: '#E2E8F0' },
    { title: 'Authorities', value: stats.totalAuthorities, icon: <Business />, color: '#8B5CF6', bgColor: '#EDE9FE' },
    { title: 'Total Upvotes', value: stats.totalUpvotes, icon: <TrendingUp />, color: '#F59E0B', bgColor: '#FEF3C7' },
    { title: 'Completed', value: stats.reportsByStatus.Completed, icon: <CheckCircle />, color: '#10B981', bgColor: '#D1FAE5' },
    { title: 'Pending', value: stats.reportsByStatus.Reported, icon: <Warning />, color: '#EF4444', bgColor: '#FEE2E2' },
    { title: 'Avg Response (hrs)', value: stats.avgResponseTime, icon: <Speed />, color: '#3B82F6', bgColor: '#DBEAFE' },
    { title: 'Discord Alerts', value: stats.totalReports, icon: <Notifications />, color: '#6366F1', bgColor: '#E0E7FF' }
  ];

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-in' }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1F2937', mb: 0.5 }}>Dashboard Overview</Typography>
        <Typography variant="body2" sx={{ color: '#4B5563' }}>Monitor platform performance and civic engagement metrics</Typography>
      </Box>
      
      <Grid container spacing={3}>
        {statCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' } }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: card.color, mb: 0.5 }}>{card.value}</Typography>
                    <Typography variant="body2" sx={{ color: '#4B5563', fontWeight: 500 }}>{card.title}</Typography>
                  </Box>
                  <Box sx={{ width: 56, height: 56, borderRadius: 2, background: card.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                    {React.cloneElement(card.icon, { sx: { fontSize: 28 } })}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1F2937', mb: 3 }}>Reports by Status</Typography>
              <Grid container spacing={2}>
                {Object.entries(stats.reportsByStatus).map(([status, count]) => (
                  <Grid item xs={6} key={status}>
                    <Box sx={{ textAlign: 'center', p: 2.5, border: '2px solid #E5E7EB', borderRadius: 2, transition: 'all 0.3s ease', '&:hover': { borderColor: '#0D9488', transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(13, 148, 136, 0.15)' } }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#0D9488', mb: 0.5 }}>{count}</Typography>
                      <Typography variant="caption" sx={{ color: '#4B5563', fontWeight: 500 }}>{status}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, border: '1px solid #E5E7EB' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1F2937', mb: 3 }}>Reports by Category</Typography>
              <Grid container spacing={2}>
                {Object.entries(stats.reportsByCategory).map(([category, count]) => (
                  <Grid item xs={6} key={category}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
                      <Typography variant="h5">{count}</Typography>
                      <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>{category}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mt: 3, borderRadius: 3, border: '1px solid #E5E7EB' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1F2937', mb: 3 }}>Department Performance</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Department</strong></TableCell>
                  <TableCell align="center"><strong>Total Issues</strong></TableCell>
                  <TableCell align="center"><strong>Completed</strong></TableCell>
                  <TableCell align="center"><strong>Pending</strong></TableCell>
                  <TableCell align="center"><strong>Completion Rate</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(stats.departmentPerformance).map(([dept, data]) => {
                  const completionRate = data.total > 0 ? ((data.completed / data.total) * 100).toFixed(1) : 0;
                  return (
                    <TableRow key={dept}>
                      <TableCell sx={{ textTransform: 'capitalize' }}>{dept}</TableCell>
                      <TableCell align="center">{data.total}</TableCell>
                      <TableCell align="center">
                        <Chip label={data.completed} color="success" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={data.pending} color="error" size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={parseFloat(completionRate)} 
                            sx={{ flex: 1, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption">{completionRate}%</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card sx={{ mt: 3, borderRadius: 3, border: '1px solid #E5E7EB' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1F2937', mb: 3 }}>Recent Activity</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Report ID</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Category</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Created</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.recentActivity.map((activity) => (
                  <TableRow key={activity.reportId}>
                    <TableCell>{activity.reportId.substring(0, 8)}...</TableCell>
                    <TableCell>{activity.type}</TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{activity.category}</TableCell>
                    <TableCell>
                      <Chip label={activity.status} size="small" color={
                        activity.status === 'Completed' ? 'success' :
                        activity.status === 'Reported' ? 'error' : 'default'
                      } />
                    </TableCell>
                    <TableCell>{new Date(activity.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AdminStats;
