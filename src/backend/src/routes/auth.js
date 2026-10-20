const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authService = require('../services/authService');
const userModel = require('../models/userModel');

// User Registration
router.post('/register', [
  body('email').isEmail(),
  body('phone').isMobilePhone(),
  body('name').notEmpty(),
  body('password').isLength({ min: 8 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, phone, name, password, address } = req.body;
    const result = await authService.registerUser({ email, phone, name, password, address });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('email').isEmail(),
  body('otp').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, otp } = req.body;
    const result = await authService.verifyOTP(email, otp);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Login (User/Authority/Admin)
router.post('/login', [
  body('username').notEmpty(),
  body('password').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, role } = req.body;
    const result = await authService.login(username, password, role);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', async (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Resend OTP
router.post('/resend-otp', [
  body('email').isEmail()
], async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.resendOTP(email);
    res.json({ message: 'OTP resent successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
