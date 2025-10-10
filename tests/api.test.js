const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

describe('AI Resume Reviewer API', () => {
  beforeAll(async () => {
    // Connect to test database
    const MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/ai-resume-reviewer-test';
    await mongoose.connect(MONGODB_URI);
  });

  afterAll(async () => {
    // Clean up and close database connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    test('GET /api/health should return 200', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Resume Analysis', () => {
    test('POST /api/resume/analyze without file should return 400', async () => {
      const response = await request(app)
        .post('/api/resume/analyze')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('GET /api/resume/recent should return array', async () => {
      const response = await request(app)
        .get('/api/resume/recent')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/resume/stats should return statistics', async () => {
      const response = await request(app)
        .get('/api/resume/stats')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('totalAnalyses');
      expect(response.body.data).toHaveProperty('averageScores');
    });
  });

  describe('Error Handling', () => {
    test('GET /api/resume/analysis/invalid-id should return 400', async () => {
      const response = await request(app)
        .get('/api/resume/analysis/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});