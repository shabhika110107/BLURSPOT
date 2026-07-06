import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, Card, CardContent, Chip, CircularProgress, Button, Dialog, DialogTitle, DialogContent, Tabs, Tab, List, ListItem, ListItemText, Divider, Collapse, IconButton } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { toast } from 'react-toastify';
import { reportService } from '../services/reportService';
import { wsService } from '../services/wsService';
import jsPDF from 'jspdf';

function MyReports({ user }) {
  const [reports, setReports] = useState([]);
  const [upvotedReports, setUpvotedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [tab, setTab] = useState(0);
  const [expandedReports, setExpandedReports] = useState({});

  useEffect(() => {
    loadReports();
    
    wsService.connect();
    wsService.addListener(handleWSMessage);
    
    return () => {
      wsService.removeListener(handleWSMessage);
    };
  }, []);

  const handleWSMessage = (data) => {
    if (data.type === 'REPORT_UPDATE' || data.type === 'REPORT_COMPLETED') {
      loadReports();
    }
  };

  const loadReports = async () => {
    try {
      const data = await reportService.getReports();
      setReports(data);
      
      // Get all reports and filter upvoted ones
      const allReports = await reportService.getAllReports();
      const upvoted = allReports.filter(r => 
        r.upvotes && r.upvotes.some(u => u.userId === user.userId)
      );
      setUpvotedReports(upvoted);
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (reportId, verified) => {
    try {
      await reportService.verifyReport(reportId, verified);
      toast.success('Verification submitted!');
      loadReports();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Verification failed');
    }
  };

  const downloadReport = async (report) => {
    try {
      const pdf = new jsPDF();
      let yPos = 20;
      
      pdf.setFontSize(18);
      pdf.text('BLURSPOT - CIVIC ISSUE REPORT', 105, yPos, { align: 'center' });
      yPos += 15;
      
      pdf.setFontSize(12);
      pdf.text(`Title: ${report.title || report.type}`, 20, yPos);
      yPos += 10;
      pdf.text(`Report ID: ${report.reportId}`, 20, yPos);
      yPos += 10;
      pdf.text(`Type: ${report.type}`, 20, yPos);
      yPos += 7;
      pdf.text(`Category: ${report.category}`, 20, yPos);
      yPos += 7;
      pdf.text(`Seriousness: ${report.seriousness}`, 20, yPos);
      yPos += 7;
      pdf.text(`Status: ${report.status}`, 20, yPos);
      yPos += 10;
      
      pdf.text('Description:', 20, yPos);
      yPos += 7;
      const descLines = pdf.splitTextToSize(report.description, 170);
      pdf.text(descLines, 20, yPos);
      yPos += descLines.length * 7 + 5;
      
      pdf.text(`Location: ${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`, 20, yPos);
      yPos += 7;
      pdf.text(`Noticed Time: ${report.noticedTime || 'N/A'}`, 20, yPos);
      yPos += 7;
      pdf.text(`Reported At: ${new Date(report.createdAt).toLocaleString()}`, 20, yPos);
      yPos += 15;
      
      // Add images
      if (report.images && report.images.length > 0) {
        pdf.text('Images:', 20, yPos);
        yPos += 10;
        
        for (let i = 0; i < report.images.length; i++) {
          if (yPos > 250) {
            pdf.addPage();
            yPos = 20;
          }
          
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = report.images[i];
            });
            
            const imgWidth = 170;
            const imgHeight = (img.height * imgWidth) / img.width;
            const maxHeight = 100;
            const finalHeight = Math.min(imgHeight, maxHeight);
            const finalWidth = (img.width * finalHeight) / img.height;
            
            pdf.addImage(img, 'JPEG', 20, yPos, finalWidth, finalHeight);
            yPos += finalHeight + 10;
          } catch (err) {
            console.error('Failed to add image:', err);
            pdf.text(`Image ${i + 1}: ${report.images[i]}`, 20, yPos);
            yPos += 7;
          }
        }
      }
      
      pdf.save(`BlurSpot_Report_${report.reportId}.pdf`);
      toast.success('Report downloaded as PDF');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
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

  if (loading) return (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}><CircularProgress sx={{ color: '#0D9488' }} /></Box>);

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-in' }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#1F2937', mb: 0.5 }}>My Reports</Typography>
        <Typography variant="body2" sx={{ color: '#4B5563' }}>Track and manage your submitted civic issues</Typography>
      </Box>
      
      <Tabs value={tab} onChange={(e, val) => setTab(val)} sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 600, fontSize: '0.95rem', '&.Mui-selected': { color: '#0D9488' } }, '& .MuiTabs-indicator': { backgroundColor: '#0D9488', height: 3, borderRadius: '3px 3px 0 0' } }}>
        <Tab label="Reported" />
        <Tab label="Upvoted" />
      </Tabs>
      
      {tab === 0 ? (
        reports.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid #E5E7EB' }}>
            <Typography variant="h6" sx={{ color: '#4B5563', mb: 1 }}>No reports yet</Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>Start by reporting a civic issue in your area</Typography>
          </Paper>
        ) : (
          reports.map(report => (
          <Card key={report.reportId} sx={{ mb: 2, borderRadius: 3, border: '1px solid #E5E7EB', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' } }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1, '&:hover': { '& .MuiTypography-root': { color: '#0D9488' } } }} onClick={() => setExpandedReports(prev => ({ ...prev, [report.reportId]: !prev[report.reportId] }))}>
                  <Typography variant="h6" sx={{ fontWeight: 600, transition: 'color 0.3s' }}>{report.title || report.type}</Typography>
                  <IconButton size="small" sx={{ transform: expandedReports[report.reportId] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', color: '#0D9488' }}><ExpandMoreIcon /></IconButton>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button size="small" variant="outlined" onClick={() => downloadReport(report)} sx={{ borderColor: '#0D9488', color: '#0D9488', '&:hover': { borderColor: '#0F766E', background: 'rgba(13, 148, 136, 0.05)' } }}>Download PDF</Button>
                  <Chip label={report.status} color={getStatusColor(report.status)} sx={{ fontWeight: 600 }} />
                </Box>
              </Box>
              
              <Collapse in={expandedReports[report.reportId]} timeout="auto" unmountOnExit>
                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #E5E7EB' }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {report.description}
                  </Typography>
                  
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    <strong>Type:</strong> {report.type} | <strong>Category:</strong> {report.category} | <strong>Seriousness:</strong> {report.seriousness}
                  </Typography>
                  
                  <Typography variant="caption" display="block">
                    <strong>Location:</strong> {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                  </Typography>

                  <Typography variant="caption" display="block">
                    <strong>Noticed:</strong> {report.noticedTime || 'N/A'} | <strong>Reported:</strong> {new Date(report.createdAt).toLocaleString()}
                  </Typography>

                  {report.images && report.images.length > 0 && (
                    <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {report.images.map((img, idx) => (
                        <Box key={idx} sx={{ borderRadius: 2, overflow: 'hidden', border: '2px solid #E5E7EB', transition: 'all 0.3s ease', '&:hover': { borderColor: '#0D9488', transform: 'scale(1.02)' } }}>
                          <img src={img} alt={`Report ${idx + 1}`} style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'cover', display: 'block' }} />
                        </Box>
                      ))}
                    </Box>
                  )}

                  {report.status === 'Completed' && report.completionImages && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Before / After</Typography>
                      <Box sx={{ maxWidth: 500, height: 300 }}>
                        <ReactCompareSlider
                          itemOne={<ReactCompareSliderImage src={report.images[0]} alt="Before" />}
                          itemTwo={<ReactCompareSliderImage src={report.completionImages[0]} alt="After" />}
                        />
                      </Box>
                    </Box>
                  )}

                  {report.status === 'Work Over' && report.awaitingVerification && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Verify Completion</Typography>
                      <Button variant="contained" color="success" onClick={() => handleVerify(report.reportId, true)} sx={{ mr: 1 }}>
                        Verify Complete
                      </Button>
                      <Button variant="outlined" color="error" onClick={() => handleVerify(report.reportId, false)}>
                        Not Complete
                      </Button>
                    </Box>
                  )}

                  <Button variant="text" onClick={() => setSelectedReport(report)} sx={{ mt: 2 }}>
                    View Timeline
                  </Button>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        ))
      )) : (
        upvotedReports.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px solid #E5E7EB' }}>
            <Typography variant="h6" sx={{ color: '#4B5563', mb: 1 }}>No upvoted reports</Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>Support community issues by upvoting reports</Typography>
          </Paper>
        ) : (
          upvotedReports.map(report => (
            <Card key={report.reportId} sx={{ mb: 2, borderRadius: 3, border: '1px solid #E5E7EB', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)' } }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{report.type}</Typography>
                  <Chip label={report.status} color={getStatusColor(report.status)} />
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {report.description}
                </Typography>
                
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Category: {report.category} | Seriousness: {report.seriousness}
                </Typography>
                
                <Chip label="Upvoted" size="small" sx={{ mt: 1, background: '#0D9488', color: 'white', fontWeight: 600 }} />
              </CardContent>
            </Card>
          ))
        )
      )}

      <Dialog open={!!selectedReport} onClose={() => setSelectedReport(null)} maxWidth="md" fullWidth>
        <DialogTitle>Report Timeline</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <List>
              {selectedReport.timeline.map((event, idx) => (
                <Box key={idx}>
                  <ListItem>
                    <ListItemText
                      primary={event.status}
                      secondary={
                        <>
                          <Typography variant="caption" display="block">
                            {new Date(event.timestamp).toLocaleString()}
                          </Typography>
                          {event.notes && <Typography variant="body2">{event.notes}</Typography>}
                        </>
                      }
                    />
                    <Chip label={event.status} color={getStatusColor(event.status)} size="small" />
                  </ListItem>
                  {idx < selectedReport.timeline.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default MyReports;
