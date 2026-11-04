const request = require('supertest');
const app = require('../server');

describe('API Tests', () => {
  describe('Health Check', () => {
    it('should return OK status', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('OK');
    });
  });

  describe('Authentication', () => {
    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'invalid', password: 'invalid' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Reports', () => {
    it('should require authentication for creating reports', async () => {
      const res = await request(app)
        .post('/api/reports')
        .send({ description: 'Test' });
      expect(res.statusCode).toBe(401);
    });
  });
});
