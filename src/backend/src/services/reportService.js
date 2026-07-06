const { v4: uuidv4 } = require('uuid');
const reportModel = require('../models/reportModel');
const userModel = require('../models/userModel');
const rekognitionService = require('./rekognitionService');
const discordService = require('./discordService');
const geoService = require('./geoService');

class ReportService {
  async createReport(reportData) {
    const { userId, title, description, type, category, latitude, longitude, images, imageKeys, userLatitude, userLongitude, seriousness, noticedTime, forceCreate } = reportData;

    // Geo-fencing check (disabled in local dev)
    if (userLatitude && userLongitude && process.env.AWS_ACCESS_KEY_ID !== 'local-dev') {
      const distance = geoService.calculateDistance(latitude, longitude, userLatitude, userLongitude);
      if (distance > 0.1) { // 100 meters
        throw new Error('Photo location does not match your current location');
      }
    }

    // Check for duplicates within 10m (skip if forceCreate)
    if (!forceCreate) {
      const duplicateCheck = await this.checkDuplicate(latitude, longitude, type, category);
      if (duplicateCheck.isDuplicate) {
        const existingReport = duplicateCheck.report;
        
        // Check if same user already reported this
        const userReports = existingReport.upvotes || [];
        const userReportCount = userReports.filter(u => u.userId === userId).length;
        
        if (userReportCount >= 2) {
          return {
            isDuplicate: true,
            cannotReport: true,
            message: 'You have already reported this issue twice. Cannot report again.',
            existingReport
          };
        }
        
        return {
          isDuplicate: true,
          canUpvote: true,
          userReportCount,
          message: `Similar report exists nearby. You have reported this ${userReportCount} time(s). Would you like to upvote or report again?`,
          existingReport
        };
      }
    }

    // AI validation with Rekognition (disabled in local dev)
    if (process.env.AWS_ACCESS_KEY_ID !== 'local-dev') {
      for (const imageKey of imageKeys) {
        const isValid = await rekognitionService.validateImage(imageKey, category);
        if (!isValid) {
          throw new Error('Image does not appear to be relevant to the reported issue');
        }
      }
    }

    // Get user karma for prioritization
    const user = await userModel.getUserById(userId);
    const priority = this.calculatePriority(seriousness, user.karma || 0);

    const reportId = uuidv4();
    const report = {
      reportId,
      userId,
      title,
      description,
      type,
      category,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      images,
      seriousness,
      noticedTime,
      status: 'Reported',
      priority,
      upvotes: [],
      createdAt: new Date().toISOString(),
      timeline: [{
        status: 'Reported',
        timestamp: new Date().toISOString(),
        by: userId
      }]
    };

    await reportModel.createReport(report);

    // Send Discord notification
    await discordService.notifyNewReport(report, user);

    // Broadcast to WebSocket clients
    global.broadcast({
      type: 'NEW_REPORT',
      data: report
    });

    return { report, message: 'Report created successfully' };
  }

  calculatePriority(seriousness, karma) {
    const seriousnessScore = { low: 1, medium: 2, high: 3, critical: 4 }[seriousness] || 2;
    const karmaScore = Math.min(karma / 10, 5); // Max 5 points from karma
    return seriousnessScore + karmaScore;
  }

  async checkDuplicate(latitude, longitude, type, category) {
    const allReports = await reportModel.getAllReports();
    const openReports = allReports.filter(r => r.status !== 'Completed');

    console.log('Checking duplicate for:', { latitude, longitude, type, category });
    console.log('Total open reports:', openReports.length);

    for (const report of openReports) {
      // First check type and category match
      if (report.type !== type || report.category !== category) {
        continue;
      }

      const distance = geoService.calculateDistance(
        latitude,
        longitude,
        report.latitude,
        report.longitude
      );
      
      console.log(`Comparing with report ${report.reportId}: distance=${distance.toFixed(4)}km, type=${report.type}, category=${report.category}`);
      
      if (distance <= 0.01) { // 10 meters
        console.log('Duplicate found!');
        return { isDuplicate: true, report };
      }
    }
    
    console.log('No duplicate found');
    return { isDuplicate: false };
  }

  async getReports(user, filters = {}) {
    const allReports = await reportModel.getAllReports();

    let filtered = allReports;

    // Filter by role
    if (user.role === 'user') {
      filtered = allReports.filter(r => r.userId === user.userId);
    } else if (user.role === 'authority') {
      filtered = allReports.filter(r => r.category === user.department);
    }

    // Apply additional filters
    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    if (filters.category) {
      filtered = filtered.filter(r => r.category === filters.category);
    }

    // Sort by priority
    filtered.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    return filtered;
  }

  async getReportById(reportId) {
    return await reportModel.getReportById(reportId);
  }

  async updateReportStatus(reportId, status, authorityId, proofImages, notes) {
    const report = await reportModel.getReportById(reportId);
    if (!report) throw new Error('Report not found');

    const update = {
      status,
      timeline: [
        ...report.timeline,
        {
          status,
          timestamp: new Date().toISOString(),
          by: authorityId,
          notes,
          proofImages
        }
      ]
    };

    if (status === 'Work Over') {
      update.completionImages = proofImages;
      update.awaitingVerification = true;
      update.verifications = [];
    }

    await reportModel.updateReport(reportId, update);

    // Get user for notification
    const user = await userModel.getUserById(report.userId);

    // Send Discord notification (anonymous)
    await discordService.notifyStatusUpdate(report, status);

    // Broadcast update
    global.broadcast({
      type: 'REPORT_UPDATE',
      data: { reportId, status, proofImages }
    });

    return await reportModel.getReportById(reportId);
  }

  async citizenVerification(reportId, userId, verified) {
    const report = await reportModel.getReportById(reportId);
    if (!report) throw new Error('Report not found');
    if (report.status !== 'Work Over') throw new Error('Report is not awaiting verification');

    const verifications = report.verifications || [];
    
    // Check if user already verified
    if (verifications.find(v => v.userId === userId)) {
      throw new Error('You have already verified this report');
    }

    verifications.push({ userId, verified, timestamp: new Date().toISOString() });

    // Check if original reporter or 3 nearby users verified
    const isOriginalReporter = report.userId === userId;
    const positiveVerifications = verifications.filter(v => v.verified).length;

    let newStatus = report.status;
    if (isOriginalReporter && verified) {
      newStatus = 'Completed';
    } else if (positiveVerifications >= 3) {
      newStatus = 'Completed';
    } else if (verifications.filter(v => !v.verified).length >= 3) {
      newStatus = 'Assigned'; // Revert to assigned
    }

    const update = { verifications };

    if (newStatus === 'Completed') {
      update.status = 'Completed';
      update.completedAt = new Date().toISOString();
      update.timeline = [
        ...report.timeline,
        {
          status: 'Completed',
          timestamp: new Date().toISOString(),
          by: 'citizen_verification'
        }
      ];

      // Award karma to reporter
      const user = await userModel.getUserById(report.userId);
      await userModel.updateUserKarma(report.userId, (user.karma || 0) + 10);

      // Broadcast completion
      global.broadcast({
        type: 'REPORT_COMPLETED',
        data: { reportId }
      });
    }

    await reportModel.updateReport(reportId, update);
    return await reportModel.getReportById(reportId);
  }

  async upvoteReport(reportId, userId) {
    const report = await reportModel.getReportById(reportId);
    if (!report) throw new Error('Report not found');

    const upvotes = report.upvotes || [];
    
    // Check if user already upvoted
    if (upvotes.find(u => u.userId === userId)) {
      throw new Error('You have already upvoted this report');
    }

    upvotes.push({
      userId,
      timestamp: new Date().toISOString()
    });

    // Increase priority with upvotes
    const newPriority = (report.priority || 0) + 0.5;

    await reportModel.updateReport(reportId, { 
      upvotes,
      priority: newPriority
    });

    // Send Discord notification for upvote
    await discordService.notifyUpvote(report, upvotes.length);

    return await reportModel.getReportById(reportId);
  }
}

module.exports = new ReportService();
