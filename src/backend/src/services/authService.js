const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const userModel = require('../models/userModel');
const authorityModel = require('../models/authorityModel');

const cognito = new AWS.CognitoIdentityServiceProvider({ region: process.env.AWS_REGION });
const ses = new AWS.SES({ region: process.env.AWS_REGION });
const sns = new AWS.SNS({ region: process.env.AWS_REGION });

class AuthService {
  async registerUser({ email, phone, name, password, address }) {
    const userId = uuidv4();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store user with pending status
    await userModel.createUser({
      userId,
      email,
      phone,
      name,
      address,
      password: await bcrypt.hash(password, 10),
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000, // 10 minutes
      verified: false,
      karma: 0,
      role: 'user'
    });

    // Send OTP via email
    await this.sendOTPEmail(email, otp);

    // Send OTP via SMS (optional)
    try {
      await this.sendOTPSMS(phone, otp);
    } catch (error) {
      console.error('SMS send failed:', error);
    }

    return { message: 'OTP sent to email and phone', userId };
  }

  async sendOTPEmail(email, otp) {
    // Mock email sending in local dev
    if (process.env.AWS_ACCESS_KEY_ID === 'local-dev') {
      console.log(`[MOCK EMAIL] OTP for ${email}: ${otp}`);
      return;
    }
    const params = {
      Source: process.env.SES_FROM_EMAIL || 'noreply@blurspot.com',
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'BlurSpot - Verify Your Account' },
        Body: {
          Text: { Data: `Your OTP is: ${otp}. Valid for 10 minutes.` },
          Html: { Data: `<h2>BlurSpot Verification</h2><p>Your OTP is: <strong>${otp}</strong></p><p>Valid for 10 minutes.</p>` }
        }
      }
    };

    try {
      await ses.sendEmail(params).promise();
    } catch (error) {
      console.error('Email send failed:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  async sendOTPSMS(phone, otp) {
    // Mock SMS in local dev
    if (process.env.AWS_ACCESS_KEY_ID === 'local-dev') {
      console.log(`[MOCK SMS] OTP for ${phone}: ${otp}`);
      return;
    }
    const params = {
      Message: `Your BlurSpot OTP is: ${otp}`,
      PhoneNumber: phone
    };
    await sns.publish(params).promise();
  }

  async verifyOTP(email, otp) {
    const user = await userModel.getUserByEmail(email);
    if (!user) throw new Error('User not found');

    console.log('Stored OTP:', user.otp, 'Type:', typeof user.otp);
    console.log('Received OTP:', otp, 'Type:', typeof otp);

    if (user.otp !== otp.toString()) throw new Error('Invalid OTP');
    if (Date.now() > user.otpExpiry) throw new Error('OTP expired');

    await userModel.updateUser(user.userId, { verified: true, otp: null, otpExpiry: null });

    const token = this.generateToken({ userId: user.userId, email: user.email, role: 'user' });
    return { token, user: { userId: user.userId, email: user.email, name: user.name, role: 'user' } };
  }

  async login(username, password, role) {
    // Admin login
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
      const token = this.generateToken({ userId: 'admin', username, role: 'admin' });
      return { token, user: { userId: 'admin', username, role: 'admin' } };
    }

    // Authority login
    const authority = await authorityModel.getAuthorityByUsername(username);
    if (authority) {
      const valid = await bcrypt.compare(password, authority.password);
      if (!valid) throw new Error('Invalid credentials');

      const token = this.generateToken({
        userId: authority.authorityId,
        username: authority.username,
        role: 'authority',
        department: authority.department,
        location: authority.location
      });
      return { token, user: { ...authority, role: 'authority' } };
    }

    // User login
    const user = await userModel.getUserByEmail(username);
    if (!user) throw new Error('Invalid credentials');
    if (!user.verified) throw new Error('Please verify your account first');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');

    const token = this.generateToken({ userId: user.userId, email: user.email, role: 'user' });
    return { token, user: { userId: user.userId, email: user.email, name: user.name, role: 'user', karma: user.karma } };
  }

  generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  }

  async resendOTP(email) {
    const user = await userModel.getUserByEmail(email);
    if (!user) throw new Error('User not found');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await userModel.updateUser(user.userId, {
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000
    });

    await this.sendOTPEmail(email, otp);
  }
}

module.exports = new AuthService();
