// Mock in-memory database for local development
const users = new Map();
const reports = new Map();
const authorities = new Map();

class MockDB {
  // Users
  async putUser(user) {
    users.set(user.userId, user);
    return user;
  }

  async getUser(userId) {
    return users.get(userId);
  }

  async getUserByEmail(email) {
    return Array.from(users.values()).find(u => u.email === email);
  }

  async getAllUsers() {
    return Array.from(users.values());
  }

  async updateUser(userId, updates) {
    const user = users.get(userId);
    if (user) {
      Object.assign(user, updates);
      users.set(userId, user);
    }
    return user;
  }

  // Reports
  async putReport(report) {
    reports.set(report.reportId, report);
    return report;
  }

  async getReport(reportId) {
    return reports.get(reportId);
  }

  async getAllReports() {
    return Array.from(reports.values());
  }

  async getReportsByUserId(userId) {
    return Array.from(reports.values()).filter(r => r.userId === userId);
  }

  async updateReport(reportId, updates) {
    const report = reports.get(reportId);
    if (report) {
      Object.assign(report, updates);
      reports.set(reportId, report);
    }
    return report;
  }

  async deleteReport(reportId) {
    reports.delete(reportId);
  }

  // Authorities
  async putAuthority(authority) {
    authorities.set(authority.authorityId, authority);
    return authority;
  }

  async getAuthority(authorityId) {
    return authorities.get(authorityId);
  }

  async getAuthorityByUsername(username) {
    return Array.from(authorities.values()).find(a => a.username === username);
  }

  async getAllAuthorities() {
    return Array.from(authorities.values());
  }
}

module.exports = new MockDB();
