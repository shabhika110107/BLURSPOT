import React, { useState, useEffect } from 'react';
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { toast } from 'react-toastify';
import axios from 'axios';
import { authService } from '../services/authService';

function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/admin/reports`,
        {
          headers: { Authorization: `Bearer ${authService.getToken()}` }
        }
      );
      setReports(response.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/admin/reports/${selectedReport.reportId}`,
        {
          headers: { Authorization: `Bearer ${authService.getToken()}` }
        }
      );
      toast.success('Report deleted successfully');
      setDeleteDialog(false);
      loadReports();
    } catch (err) {
      toast.error('Failed to delete report');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Reported': 'error',
      'Reviewed': 'warning',
      'Assigned': 'info',
      'Work Over': 'primary',
      'Completed': 'success'
    };
    return colors[status] || 'default';
  };

  if (loading) return <CircularProgress />;

  return (
    <div>
      <Typography variant="h5" gutterBottom>Reports Management</Typography>
      
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.reportId}>
                <TableCell>{report.type}</TableCell>
                <TableCell>{report.category}</TableCell>
                <TableCell>
                  <Chip label={report.status} color={getStatusColor(report.status)} size="small" />
                </TableCell>
                <TableCell>{report.priority || 0}</TableCell>
                <TableCell>
                  {report.latitude?.toFixed(2)}, {report.longitude?.toFixed(2)}
                </TableCell>
                <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => {
                      setSelectedReport(report);
                      setDeleteDialog(true);
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this report? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default AdminReports;
