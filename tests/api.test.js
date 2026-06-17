const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');

// ── Mock OpenAI before requiring app ─────────────────────────────────────────
jest.mock('../services/openaiService', () => ({
  analyzeResume: jest.fn().mockResolvedValue({
    toneScore: 8,
    formattingScore: 7,
    clarityScore: 9,
    overallScore: 8,
    strengths: ['Clear structure', 'Quantified achievements', 'Strong action verbs'],
    weaknesses: ['Objective statement is vague', 'Missing LinkedIn URL'],
    suggestions: ['Add measurable outcomes to each role', 'Include a skills section'],
    detailedFeedback: 'This is a strong resume with good structure and clear language.'
  })
}));

const app = require('../server');

describe('AI Resume Reviewer API', () => {
  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/ai-resume-reviewer-test';
    await mongoose.connect(MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  // ── Health Check ────────────────────────────────────────────────────────────
  describe('Health Check', () => {
    test('GET /api/health returns 200 with DB status', async () => {
      const response = await request(app).get('/api/health').expect(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database', 'connected');
      expect(response.headers).toHaveProperty('x-request-id');
    });
  });

  // ── Resume Upload ───────────────────────────────────────────────────────────
  describe('POST /api/resume/analyze', () => {
    test('returns 400 when no file is uploaded', async () => {
      const response = await request(app)
        .post('/api/resume/analyze')
        .expect(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('returns 400 for unsupported file type (e.g. .jpg)', async () => {
      const response = await request(app)
        .post('/api/resume/analyze')
        .attach('resume', Buffer.from('fake image data'), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg'
        })
        .expect(400);
      expect(response.body).toHaveProperty('success', false);
    });

    test('returns 400 for oversized file (> 5MB)', async () => {
      const bigBuffer = Buffer.alloc(6 * 1024 * 1024, 'a'); // 6MB
      const response = await request(app)
        .post('/api/resume/analyze')
        .attach('resume', bigBuffer, {
          filename: 'big.txt',
          contentType: 'text/plain'
        })
        .expect(400);
      expect(response.body).toHaveProperty('success', false);
    });

    test('returns 200 and analysis for a valid TXT resume', async () => {
      const resumeText = `
        John Doe | john@example.com | linkedin.com/in/johndoe
        EXPERIENCE
        Software Engineer at Acme Corp (2020-2024)
        - Increased deployment frequency by 40% using CI/CD pipelines
        - Led team of 5 engineers to deliver $2M project on time
        EDUCATION
        B.S. Computer Science, State University, 2020
        SKILLS: JavaScript, Node.js, MongoDB, AWS
      `;
      const response = await request(app)
        .post('/api/resume/analyze')
        .attach('resume', Buffer.from(resumeText), {
          filename: 'resume.txt',
          contentType: 'text/plain'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('fileName', 'resume.txt');
      expect(response.body.data.analysis).toHaveProperty('overallScore');
      expect(response.body.data.analysis).toHaveProperty('strengths');
      expect(response.body.data.analysis).toHaveProperty('suggestions');
      expect(response.headers).toHaveProperty('x-request-id');
    });
  });

  // ── Recent Analyses ─────────────────────────────────────────────────────────
  describe('GET /api/resume/recent', () => {
    test('returns array (may be empty)', async () => {
      const response = await request(app)
        .get('/api/resume/recent')
        .expect(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('respects limit query parameter', async () => {
      const response = await request(app)
        .get('/api/resume/recent?limit=2')
        .expect(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  // ── Stats ───────────────────────────────────────────────────────────────────
  describe('GET /api/resume/stats', () => {
    test('returns statistics object with required fields', async () => {
      const response = await request(app)
        .get('/api/resume/stats')
        .expect(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('totalAnalyses');
      expect(response.body.data).toHaveProperty('averageScores');
    });
  });

  // ── Error Handling ──────────────────────────────────────────────────────────
  describe('Error Handling', () => {
    test('GET /api/resume/analysis/invalid-id returns 400', async () => {
      const response = await request(app)
        .get('/api/resume/analysis/not-a-valid-mongo-id')
        .expect(400);
      expect(response.body).toHaveProperty('success', false);
    });

    test('GET /api/resume/analysis/:id with non-existent valid id returns 404', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/resume/analysis/${fakeId}`)
        .expect(404);
      expect(response.body).toHaveProperty('success', false);
    });

    test('DELETE /api/resume/analysis/invalid-id returns 400', async () => {
      const response = await request(app)
        .delete('/api/resume/analysis/not-valid')
        .expect(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });
});