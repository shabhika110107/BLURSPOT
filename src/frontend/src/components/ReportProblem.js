import React, { useState, useRef } from 'react';
import { Paper, Typography, TextField, Button, Select, MenuItem, FormControl, InputLabel, Box, CircularProgress, Alert, Chip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Grid, Accordion, AccordionSummary, AccordionDetails, ButtonGroup } from '@mui/material';
import { Close as CloseIcon, ExpandMore as ExpandMoreIcon, Help as HelpIcon, CameraAlt as CameraIcon, Upload as UploadIcon } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { reportService } from '../services/reportService';
import EXIF from 'exif-js';
import L from 'leaflet';

function LocationPicker({ position, setPosition, setAddress }) {
  const map = useMap();
  
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      // Reverse geocoding to get address
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`)
        .then(res => res.json())
        .then(data => setAddress(data.display_name))
        .catch(() => setAddress('Location selected'));
    }
  });
  
  return position ? <Marker position={position} /> : null;
}

function SearchBox({ setPosition, setAddress }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!search) return;
    setSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}`);
      const data = await response.json();
      setResults(data.slice(0, 5));
    } catch (error) {
      toast.error('Search failed');
    }
    setSearching(false);
  };

  const selectLocation = (result) => {
    setPosition([parseFloat(result.lat), parseFloat(result.lon)]);
    setAddress(result.display_name);
    setResults([]);
    setSearch('');
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search location (e.g., Times Square, New York)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button variant="outlined" onClick={handleSearch} disabled={searching}>
          {searching ? <CircularProgress size={20} /> : 'Search'}
        </Button>
      </Box>
      {results.length > 0 && (
        <Paper sx={{ mt: 1, maxHeight: 200, overflow: 'auto' }}>
          {results.map((result, idx) => (
            <Box
              key={idx}
              sx={{ p: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
              onClick={() => selectLocation(result)}
            >
              <Typography variant="body2">{result.display_name}</Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
}

function ReportProblem({ user }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    category: '',
    seriousness: 'medium',
    noticedTime: ''
  });
  const [position, setPosition] = useState([11.1271, 78.6569]); // Tamil Nadu center
  const [userPosition, setUserPosition] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateDialog, setDuplicateDialog] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);
  const [helpDialog, setHelpDialog] = useState(false);
  const [cameraDialog, setCameraDialog] = useState(false);
  const [stream, setStream] = useState(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  useState(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        setUserPosition(coords);
      },
      (err) => console.error('Geolocation error:', err)
    );
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      EXIF.getData(file, function() {
        const lat = EXIF.getTag(this, 'GPSLatitude');
        const lon = EXIF.getTag(this, 'GPSLongitude');
        
        if (lat && lon) {
          const latitude = lat[0] + lat[1]/60 + lat[2]/3600;
          const longitude = lon[0] + lon[1]/60 + lon[2]/3600;
          console.log('Image GPS:', latitude, longitude);
        }
      });
    });

    setImages([...images, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      setStream(mediaStream);
      setCameraDialog(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraDialog(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setImages([...images, file]);
        toast.success('Photo captured');
        stopCamera();
      }, 'image/jpeg', 0.9);
    }
  };

  const blurImage = (imageFile) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.filter = 'blur(5px)';
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(resolve);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('seriousness', formData.seriousness);
      formDataToSend.append('noticedTime', formData.noticedTime);
      formDataToSend.append('latitude', position[0]);
      formDataToSend.append('longitude', position[1]);
      
      if (userPosition) {
        formDataToSend.append('userLatitude', userPosition[0]);
        formDataToSend.append('userLongitude', userPosition[1]);
      }

      images.forEach(img => formDataToSend.append('images', img));

      const response = await reportService.createReport(formDataToSend);
      
      if (response.isDuplicate) {
        if (response.cannotReport) {
          toast.error(response.message);
        } else if (response.canUpvote) {
          setDuplicateData(response);
          setDuplicateDialog(true);
        }
      } else {
        toast.success('Report submitted successfully!');
        setFormData({ title: '', description: '', type: '', category: '', seriousness: 'medium', noticedTime: '' });
        setImages([]);
        setTimeout(() => {
          navigate('/user/reports');
        }, 500);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to submit report');
      toast.error(err.response?.data?.error || err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    try {
      await reportService.upvoteReport(duplicateData.existingReport.reportId);
      toast.success('Upvoted successfully!');
      setDuplicateDialog(false);
      setDuplicateData(null);
      setFormData({ title: '', description: '', type: '', category: '', seriousness: 'medium', noticedTime: '' });
      setImages([]);
      setTimeout(() => {
        navigate('/user/reports');
      }, 500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upvote');
    }
  };

  const handleReportAnyway = async () => {
    setDuplicateDialog(false);
    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('seriousness', formData.seriousness);
      formDataToSend.append('noticedTime', formData.noticedTime);
      formDataToSend.append('latitude', position[0]);
      formDataToSend.append('longitude', position[1]);
      formDataToSend.append('forceCreate', 'true');
      
      if (userPosition) {
        formDataToSend.append('userLatitude', userPosition[0]);
        formDataToSend.append('userLongitude', userPosition[1]);
      }

      images.forEach(img => formDataToSend.append('images', img));

      const response = await reportService.createReport(formDataToSend);
      toast.success('Report submitted successfully!');
      setFormData({ title: '', description: '', type: '', category: '', seriousness: 'medium', noticedTime: '' });
      setImages([]);
      setTimeout(() => {
        navigate('/user/reports');
      }, 500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 3, border: '1px solid #E5E7EB', maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.5s ease-in' }}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#1F2937', mb: 0.5 }}>Report a Problem</Typography>
          <Typography variant="body2" sx={{ color: '#4B5563' }}>Help improve your community by reporting civic issues</Typography>
        </Box>
        <Button startIcon={<HelpIcon />} onClick={() => setHelpDialog(true)} variant="outlined" size="small" sx={{ borderColor: '#0D9488', color: '#0D9488', '&:hover': { borderColor: '#0F766E', background: 'rgba(13, 148, 136, 0.05)' } }}>Help</Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <Box sx={{ maxWidth: '600px' }}>
          <TextField fullWidth label="Title" name="title" value={formData.title} onChange={handleChange} margin="normal" required helperText="Brief title for the issue" sx={{ mb: 2 }} />
          <TextField fullWidth label="Description" name="description" value={formData.description} onChange={handleChange} margin="normal" multiline rows={3} required sx={{ mb: 2 }} />
        </Box>
        
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, maxWidth: '600px', mb: 2 }}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Type</InputLabel>
            <Select name="type" value={formData.type} onChange={handleChange}>
              <MenuItem value="pothole">Pothole</MenuItem>
              <MenuItem value="trash">Trash/Garbage</MenuItem>
              <MenuItem value="water_leak">Water Leak</MenuItem>
              <MenuItem value="street_light">Street Light</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Category</InputLabel>
            <Select name="category" value={formData.category} onChange={handleChange}>
              <MenuItem value="roads">Roads</MenuItem>
              <MenuItem value="water">Water</MenuItem>
              <MenuItem value="sanitation">Sanitation</MenuItem>
              <MenuItem value="electricity">Electricity</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, maxWidth: '600px', mb: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Seriousness</InputLabel>
            <Select name="seriousness" value={formData.seriousness} onChange={handleChange}>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>

          <TextField fullWidth label="When did you notice this?" name="noticedTime" value={formData.noticedTime} onChange={handleChange} margin="normal" sx={{ mt: 1 }} />
        </Box>

        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Select Location on Map</Typography>
          <SearchBox setPosition={setPosition} setAddress={setSelectedAddress} />
          {selectedAddress && (
            <Chip 
              label={selectedAddress} 
              onDelete={() => setSelectedAddress('')} 
              sx={{ mb: 1, maxWidth: '100%' }} 
            />
          )}
          <Box sx={{ height: 400, mb: 2, border: '2px solid #ddd', borderRadius: 1, overflow: 'auto' }}>
            <MapContainer 
              center={position} 
              zoom={7} 
              style={{ height: '100%', width: '100%', minHeight: '400px' }}
              scrollWheelZoom={false}
              dragging={true}
            >
              <TileLayer 
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <LocationPicker position={position} setPosition={setPosition} setAddress={setSelectedAddress} />
            </MapContainer>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Click on the map to select location or use search above. Drag to pan, double-click to zoom.
          </Typography>
        </Box>

        <Box sx={{ my: 3 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: '#1F2937', mb: 2 }}>Upload Photos (minimum 3 required)</Typography>
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2, background: '#DBEAFE', maxWidth: '600px' }}>Photos will be validated by AI. Please blur any faces or license plates for privacy.</Alert>
          
          <ButtonGroup variant="outlined" sx={{ mb: 2 }}>
            <Button startIcon={<CameraIcon />} onClick={startCamera} sx={{ borderColor: '#0D9488', color: '#0D9488', '&:hover': { borderColor: '#0F766E', background: 'rgba(13, 148, 136, 0.05)' } }}>Take Photo</Button>
            <Button startIcon={<UploadIcon />} onClick={() => fileInputRef.current?.click()} sx={{ borderColor: '#0D9488', color: '#0D9488', '&:hover': { borderColor: '#0F766E', background: 'rgba(13, 148, 136, 0.05)' } }}>Upload Photos</Button>
          </ButtonGroup>
          
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
          
          {images.length > 0 && (
            <Box sx={{ mt: 2, maxWidth: '600px' }}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 500, color: '#1F2937' }}>{images.length} image(s) selected</Typography>
              <Grid container spacing={2}>
                {images.map((img, idx) => (
                  <Grid item xs={4} key={idx}>
                    <Box sx={{ position: 'relative', paddingTop: '100%', border: '2px solid #E5E7EB', borderRadius: 2, overflow: 'hidden', transition: 'all 0.3s ease', '&:hover': { borderColor: '#0D9488', transform: 'scale(1.02)' } }}>
                      <img 
                        src={URL.createObjectURL(img)} 
                        alt={`Preview ${idx}`} 
                        style={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover',
                          borderRadius: 4
                        }} 
                      />
                      <IconButton
                        size="small"
                        onClick={() => removeImage(idx)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(255, 255, 255, 0.95)',
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                          '&:hover': { 
                            bgcolor: '#EF233C',
                            color: 'white',
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>

        <Box sx={{ maxWidth: '600px' }}>
          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading || images.length < 3} sx={{ py: 1.5, background: '#0D9488', '&:hover': { background: '#0F766E' }, '&:disabled': { background: '#CBD5E1', color: '#94A3B8' } }}>
            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Submit Report'}
          </Button>
        </Box>
      </form>

      <Dialog open={duplicateDialog} onClose={() => setDuplicateDialog(false)}>
        <DialogTitle>Similar Report Exists</DialogTitle>
        <DialogContent>
          {duplicateData && (
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                {duplicateData.message}
              </Alert>
              <Typography variant="subtitle2" gutterBottom>Existing Report:</Typography>
              <Typography variant="body2"><strong>Type:</strong> {duplicateData.existingReport.type}</Typography>
              <Typography variant="body2"><strong>Category:</strong> {duplicateData.existingReport.category}</Typography>
              <Typography variant="body2"><strong>Seriousness:</strong> {duplicateData.existingReport.seriousness}</Typography>
              <Typography variant="body2"><strong>Status:</strong> {duplicateData.existingReport.status}</Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>{duplicateData.existingReport.description}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDuplicateDialog(false)}>Cancel</Button>
          {duplicateData && duplicateData.userReportCount < 2 && (
            <Button onClick={handleReportAnyway} variant="outlined">Report Anyway</Button>
          )}
          <Button onClick={handleUpvote} variant="contained" color="primary">Upvote</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={helpDialog} onClose={() => setHelpDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Department Guide - Which Issue Belongs Where?</DialogTitle>
        <DialogContent>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="primary">🛣️ Roads Department</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">
                <strong>Report these issues:</strong>
                <ul>
                  <li>Potholes and road damage</li>
                  <li>Broken or missing road signs</li>
                  <li>Traffic signal malfunctions</li>
                  <li>Road cracks and uneven surfaces</li>
                  <li>Missing or damaged speed breakers</li>
                  <li>Road construction debris</li>
                </ul>
                <strong>Login Credentials:</strong> authority1 / auth123
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="primary">💧 Water Department</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">
                <strong>Report these issues:</strong>
                <ul>
                  <li>Water leaks and pipe bursts</li>
                  <li>Drainage problems</li>
                  <li>Sewage overflow</li>
                  <li>Blocked drains</li>
                  <li>Water supply issues</li>
                  <li>Manhole cover problems</li>
                </ul>
                <strong>Login Credentials:</strong> authority2 / auth123
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="primary">🗑️ Sanitation Department</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">
                <strong>Report these issues:</strong>
                <ul>
                  <li>Garbage accumulation</li>
                  <li>Overflowing trash bins</li>
                  <li>Illegal dumping</li>
                  <li>Littering in public areas</li>
                  <li>Broken or missing dustbins</li>
                  <li>Waste collection delays</li>
                </ul>
                <strong>Login Credentials:</strong> authority3 / auth123
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" color="primary">⚡ Electricity Department</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2">
                <strong>Report these issues:</strong>
                <ul>
                  <li>Street light not working</li>
                  <li>Exposed electrical wires</li>
                  <li>Damaged electric poles</li>
                  <li>Power outages</li>
                  <li>Transformer issues</li>
                  <li>Electrical hazards</li>
                </ul>
                <strong>Login Credentials:</strong> authority4 / auth123
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Note:</strong> Select the appropriate category when reporting. The issue will be automatically routed to the correct department and they will receive a Discord notification with login credentials.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={cameraDialog} onClose={stopCamera} maxWidth="md" fullWidth>
        <DialogTitle>Capture Photo</DialogTitle>
        <DialogContent>
          <Box sx={{ position: 'relative', width: '100%', bgcolor: 'black', borderRadius: 1, overflow: 'hidden' }}>
            <video ref={videoRef} autoPlay playsInline style={{ width: '100%', display: 'block' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={stopCamera}>Cancel</Button>
          <Button onClick={capturePhoto} variant="contained" startIcon={<CameraIcon />}>Capture</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default ReportProblem;
