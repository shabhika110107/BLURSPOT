const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const userModel = require('../models/userModel');

// Get User Profile
router.get('/profile', authenticate, async (req, res, next) => {
  try {
    const user = await userModel.getUserById(req.user.userId);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update User Profile
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const updated = await userModel.updateUser(req.user.userId, { name, phone, address });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Get Karma Points
router.get('/karma', authenticate, async (req, res, next) => {
  try {
    const user = await userModel.getUserById(req.user.userId);
    res.json({ karma: user.karma || 0 });
  } catch (error) {
    next(error);
  }
});

// Get User Reports
router.get('/reports', authenticate, async (req, res, next) => {
  try {
    const reportModel = require('../models/reportModel');
    const reports = await reportModel.getReportsByUserId(req.user.userId);
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
