const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const reportService = require('../services/reportService');

const USE_MOCK = process.env.AWS_ACCESS_KEY_ID === 'local-dev';

let upload;

if (USE_MOCK) {
  // Use memory storage for local dev
  upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
  });
} else {
  const multerS3 = require('multer-s3');
  const { S3 } = require('aws-sdk');
  const s3 = new S3({
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  });
  
  upload = multer({
    storage: multerS3({
      s3: s3,
      bucket: process.env.S3_BUCKET_NAME,
      acl: 'public-read',
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        cb(null, `reports/${Date.now()}-${file.originalname}`);
      }
    }),
    limits: { fileSize: 10 * 1024 * 1024 }
  });
}

// Create Report
router.post('/', authenticate, upload.array('images', 5), [
  body('description').notEmpty(),
  body('type').notEmpty(),
  body('category').notEmpty(),
  body('latitude').isFloat(),
  body('longitude').isFloat()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const reportData = {
      ...req.body,
      userId: req.user.userId,
      images: USE_MOCK ? (req.files && req.files.length > 0 ? req.files.map(f => `data:${f.mimetype};base64,${f.buffer.toString('base64')}`) : ['mock-image-url']) : req.files.map(f => f.location),
      imageKeys: USE_MOCK ? ['mock-key'] : req.files.map(f => f.key)
    };

    const report = await reportService.createReport(reportData);
    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
});

// Get Reports (filtered by role)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, category } = req.query;
    const reports = await reportService.getReports(req.user, { status, category });
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

// Get All Reports (for upvote checking)
router.get('/all', authenticate, async (req, res, next) => {
  try {
    const reportModel = require('../models/reportModel');
    const reports = await reportModel.getAllReports();
    res.json(reports);
  } catch (error) {
    next(error);
  }
});

// Get Report by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const report = await reportService.getReportById(req.params.id);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// Update Report Status (Authority only)
router.put('/:id/status', authenticate, [
  body('status').isIn(['Reviewed', 'Assigned', 'Work Over', 'Completed'])
], async (req, res, next) => {
  try {
    if (req.user.role !== 'authority' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { status, proofImages, notes } = req.body;
    const report = await reportService.updateReportStatus(
      req.params.id,
      status,
      req.user.userId,
      proofImages,
      notes
    );
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// Citizen Verification
router.post('/:id/verify', authenticate, async (req, res, next) => {
  try {
    const { verified } = req.body;
    const report = await reportService.citizenVerification(
      req.params.id,
      req.user.userId,
      verified
    );
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// Upload Proof Images
router.post('/:id/proof', authenticate, upload.array('proofImages', 5), async (req, res, next) => {
  try {
    const proofUrls = req.files.map(f => f.location);
    res.json({ proofUrls });
  } catch (error) {
    next(error);
  }
});

// Check Duplicates
router.post('/check-duplicate', authenticate, [
  body('latitude').isFloat(),
  body('longitude').isFloat()
], async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    const duplicate = await reportService.checkDuplicate(latitude, longitude);
    res.json(duplicate);
  } catch (error) {
    next(error);
  }
});

// Upvote Report
router.post('/:id/upvote', authenticate, async (req, res, next) => {
  try {
    const report = await reportService.upvoteReport(req.params.id, req.user.userId);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
