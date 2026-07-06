import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, LinearProgress, Card, CardContent } from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';
import axios from 'axios';
import { authService } from '../services/authService';

function KarmaDisplay({ user }) {
  const [karma, setKarma] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKarma();
  }, []);

  const loadKarma = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/users/karma`,
        {
          headers: { Authorization: `Bearer ${authService.getToken()}` }
        }
      );
      setKarma(response.data.karma);
    } catch (err) {
      console.error('Failed to load karma:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLevel = (karma) => {
    if (karma >= 100) return 'Gold';
    if (karma >= 50) return 'Silver';
    if (karma >= 20) return 'Bronze';
    return 'Beginner';
  };

  const getNextLevel = (karma) => {
    if (karma < 20) return 20;
    if (karma < 50) return 50;
    if (karma < 100) return 100;
    return 100;
  };

  const level = getLevel(karma);
  const nextLevel = getNextLevel(karma);
  const progress = (karma / nextLevel) * 100;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Karma Points</Typography>
      
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <EmojiEvents sx={{ fontSize: 60, mr: 2 }} />
            <Box>
              <Typography variant="h3">{karma}</Typography>
              <Typography variant="h6">{level} Level</Typography>
            </Box>
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Progress to next level: {karma} / {nextLevel}
            </Typography>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
          </Box>
        </CardContent>
      </Card>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>How to Earn Karma</Typography>
        <Box component="ul">
          <li><Typography variant="body2">Report verified issues: +10 points</Typography></li>
          <li><Typography variant="body2">Complete citizen verification: +5 points</Typography></li>
          <li><Typography variant="body2">High-quality reports with photos: +2 bonus points</Typography></li>
        </Box>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Benefits</Typography>
        <Box component="ul">
          <li><Typography variant="body2">Higher karma = Higher priority for your reports</Typography></li>
          <li><Typography variant="body2">Gold level users get featured on leaderboard</Typography></li>
          <li><Typography variant="body2">Special badges and recognition</Typography></li>
        </Box>
      </Paper>
    </Box>
  );
}

export default KarmaDisplay;
