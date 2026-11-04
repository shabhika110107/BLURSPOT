const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middleware/auth');
const userModel = require('../models/userModel');
const reportModel = require('../models/reportModel');
const authorityModel = require('../models/authorityModel');

// Get All Users
router.get('/users', authenticate, isAdmin, async (req, res, next) => {
  try {
    const users = await userModel.getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get All Authorities
router.get('/authorities', authenticate, isAdmin, async (req, res, next) => {
  try {
    const authorities = await authorityModel.getAllAuthorities();
    res.json(authorities);
  } catch (error) {
    next(error);
  }
});

// Get All Reports
router.get('/reports', authenticate, isAdmin, async (req, res, next) => {
  try {
    const reports = await reportModel.getAllReports();
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

// Delete Report (fake reports)
router.delete('/reports/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    await reportModel.deleteReport(req.params.id);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Update User Karma
router.put('/users/:id/karma', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { karma } = req.body;
    await userModel.updateUserKarma(req.params.id, karma);
    res.json({ message: 'Karma updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Get Dashboard Stats
router.get('/stats', authenticate, isAdmin, async (req, res, next) => {
  try {
    const users = await userModel.getAllUsers();
    const reports = await reportModel.getAllReports();
    const authorities = await authorityModel.getAllAuthorities();

    const reportsByStatus = {
      Reported: reports.filter(r => r.status === 'Reported').length,
      Reviewed: reports.filter(r => r.status === 'Reviewed').length,
      Assigned: reports.filter(r => r.status === 'Assigned').length,
      'Work Over': reports.filter(r => r.status === 'Work Over').length,
      Completed: reports.filter(r => r.status === 'Completed').length
    };

    const reportsByCategory = {
      roads: reports.filter(r => r.category === 'roads').length,
      water: reports.filter(r => r.category === 'water').length,
      sanitation: reports.filter(r => r.category === 'sanitation').length,
      electricity: reports.filter(r => r.category === 'electricity').length,
      other: reports.filter(r => r.category === 'other').length
    };

    const departmentPerformance = {
      roads: {
        total: reports.filter(r => r.category === 'roads').length,
        completed: reports.filter(r => r.category === 'roads' && r.status === 'Completed').length,
        pending: reports.filter(r => r.category === 'roads' && r.status === 'Reported').length
      },
      water: {
        total: reports.filter(r => r.category === 'water').length,
        completed: reports.filter(r => r.category === 'water' && r.status === 'Completed').length,
        pending: reports.filter(r => r.category === 'water' && r.status === 'Reported').length
      },
      sanitation: {
        total: reports.filter(r => r.category === 'sanitation').length,
        completed: reports.filter(r => r.category === 'sanitation' && r.status === 'Completed').length,
        pending: reports.filter(r => r.category === 'sanitation' && r.status === 'Reported').length
      },
      electricity: {
        total: reports.filter(r => r.category === 'electricity').length,
        completed: reports.filter(r => r.category === 'electricity' && r.status === 'Completed').length,
        pending: reports.filter(r => r.category === 'electricity' && r.status === 'Reported').length
      }
    };

    const totalUpvotes = reports.reduce((sum, r) => sum + (r.upvotes?.length || 0), 0);
    const avgResponseTime = reports.filter(r => r.status !== 'Reported').length > 0 
      ? reports.filter(r => r.timeline?.length > 1).reduce((sum, r) => {
          const created = new Date(r.createdAt).getTime();
          const reviewed = new Date(r.timeline[1]?.timestamp).getTime();
          return sum + (reviewed - created);
        }, 0) / reports.filter(r => r.timeline?.length > 1).length / (1000 * 60 * 60)
      : 0;

    const stats = {
      totalUsers: users.length,
      totalReports: reports.length,
      totalAuthorities: authorities.length,
      totalUpvotes,
      avgResponseTime: avgResponseTime.toFixed(1),
      reportsByStatus,
      reportsByCategory,
      departmentPerformance,
      recentActivity: reports.slice(-10).reverse().map(r => ({
        reportId: r.reportId,
        type: r.type,
        category: r.category,
        status: r.status,
        createdAt: r.createdAt
      }))
    };

    res.json(stats);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
