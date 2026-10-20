import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, Card, CardContent, Chip, Button, Dialog, DialogTitle, DialogContent, TextField, Select, MenuItem, FormControl, InputLabel, CircularProgress } from '@mui/material';
import { toast } from 'react-toastify';
import { reportService } from '../services/reportService';
import { wsService } from '../services/wsService';

function AuthorityReports({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [proofFiles, setProofFiles] = useState([]);

  useEffect(() => {
    loadReports();
    
    wsService.connect();
    wsService.addListener(handleWSMessage);
    
    return () => {
      wsService.removeListener(handleWSMessage);
    };
  }, []);

  const handleWSMessage = (data) => {
    if (data.type === 'NEW_REPORT' || data.type === 'REPORT_UPDATE') {
      loadReports();
      if (data.type === 'NEW_REPORT') {
        toast.info('New report received!');
      }
    }
  };

  const loadReports = async () => {
    try {
      const data = await reportService.getReports();
      // Sort by priority
      data.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      setReports(data);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    try {
      let proofUrls = [];
      
      if (proofFiles.length > 0) {
        const uploadResponse = await reportService.uploadProofImages(selectedReport.reportId, proofFiles);
        proofUrls = uploadResponse.proofUrls;
      }

      await reportService.updateReportStatus(selectedReport.reportId, newStatus, proofUrls, notes);
      toast.success('Status updated successfully!');
      setStatusDialog(false);
      setSelectedReport(null);
      setNewStatus('');
      setNotes('');
      setProofFiles([]);
      loadReports();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const openStatusDialog = (report) => {
    setSelectedReport(report);
    setNewStatus(getNextStatus(report.status));
    setStatusDialog(true);
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      'Reported': 'Reviewed',
      'Reviewed': 'Assigned',
      'Assigned': 'Work Over'
    };
    return flow[currentStatus] || 'Reviewed';
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
    <Box>
      <Typography variant="h5" gutterBottom>Assigned Reports</Typography>
      
      {reports.length === 0 ? (
        <Typography>No reports assigned</Typography>
      ) : (
        reports.map(report => (
          <Card key={report.reportId} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6">{report.type}</Typography>
                  <Chip label={`Priority: ${report.priority || 0}`} size="small" color="primary" sx={{ mr: 1 }} />
                  <Chip label={report.status} color={getStatusColor(report.status)} size="small" />
                </Box>
                {report.status !== 'Completed' && report.status !== 'Work Over' && (
                  <Button variant="contained" onClick={() => openStatusDialog(report)}>
                    Update Status
                  </Button>
                )}
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {report.description}
              </Typography>
              
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                <strong>Category:</strong> {report.category} | <strong>Seriousness:</strong> {report.seriousness}
              </Typography>
              
              <Typography variant="caption" display="block">
                <strong>Location:</strong> {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
              </Typography>

              <Typography variant="caption" display="block">
                <strong>Reported:</strong> {new Date(report.createdAt).toLocaleString()}
              </Typography>

              {report.images && report.images.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {report.images.map((img, idx) => (
                    <img key={idx} src={img} alt={`Report ${idx}`} style={{ maxWidth: 150, maxHeight: 150, borderRadius: 4, border: '1px solid #ddd' }} />
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Report Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>New Status</InputLabel>
            <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              <MenuItem value="Reviewed">Reviewed</MenuItem>
              <MenuItem value="Assigned">Assigned</MenuItem>
              <MenuItem value="Work Over">Work Over</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />

          {(newStatus === 'Assigned' || newStatus === 'Work Over') && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Upload Proof Images {newStatus === 'Work Over' && '(Required)'}
              </Typography>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setProofFiles(Array.from(e.target.files))}
              />
            </Box>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={handleUpdateStatus} fullWidth>
              Update
            </Button>
            <Button variant="outlined" onClick={() => setStatusDialog(false)} fullWidth>
              Cancel
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default AuthorityReports;
