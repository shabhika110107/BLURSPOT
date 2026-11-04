import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Paper, Typography, Chip, Box, CircularProgress } from '@mui/material';
import { reportService } from '../services/reportService';
import { wsService } from '../services/wsService';

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png')
});

// Custom marker icons
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const yellowIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapView({ user }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState([11.1271, 78.6569]); // Tamil Nadu

  useEffect(() => {
    loadReports();
    
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.error('Geolocation error:', err)
    );

    wsService.connect();
    wsService.addListener(handleWSMessage);
    
    return () => {
      wsService.removeListener(handleWSMessage);
    };
  }, []);

  const handleWSMessage = (data) => {
    if (data.type === 'NEW_REPORT' || data.type === 'REPORT_UPDATE' || data.type === 'REPORT_COMPLETED') {
      loadReports();
    }
  };

  const loadReports = async () => {
    try {
      const data = await reportService.getReports();
      setReports(data.filter(r => r.status !== 'Completed')); // Don't show completed
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerIcon = (status) => {
    const iconUrls = {
      'Reported': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      'Reviewed': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
      'Assigned': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
      'Work Over': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
    };
    
    const iconUrl = iconUrls[status] || iconUrls['Reported'];
    
    return new L.Icon({
      iconUrl,
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  if (loading) return <CircularProgress />;

  return (
    <Paper sx={{ p: 2, height: 'calc(100vh - 150px)' }}>
      <Typography variant="h5" gutterBottom>Map View</Typography>
      <Box sx={{ height: 'calc(100% - 50px)' }}>
        <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {reports.map(report => (
              <Marker
                key={report.reportId}
                position={[report.latitude, report.longitude]}
                icon={getMarkerIcon(report.status)}
              >
                <Popup>
                  <Box>
                    <Typography variant="subtitle1"><strong>{report.type}</strong></Typography>
                    <Chip label={report.status} size="small" sx={{ mb: 1 }} />
                    <Typography variant="body2">{report.description}</Typography>
                    <Typography variant="caption" display="block">Category: {report.category}</Typography>
                    {report.images && report.images[0] && (
                      <img src={report.images[0]} alt="Report" style={{ width: '100%', maxHeight: 150, marginTop: 8 }} />
                    )}
                  </Box>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </Box>
    </Paper>
  );
}

export default MapView;
