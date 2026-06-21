# Technical Implementation Guide

> **Purpose:** This document provides complete, step-by-step instructions for an AI agent to reconstruct the AI Resume Reviewer application from scratch. Follow the sections in order.

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Project Initialization](#2-project-initialization)
3. [Environment Configuration](#3-environment-configuration)
4. [Database Layer — MongoDB Schema](#4-database-layer--mongodb-schema)
5. [File Upload Middleware](#5-file-upload-middleware)
6. [Text Extraction Service](#6-text-extraction-service)
7. [OpenAI Integration Service](#7-openai-integration-service)
8. [REST API Routes](#8-rest-api-routes)
9. [Error Handling Middleware](#9-error-handling-middleware)
10. [Express Server Entry Point](#10-express-server-entry-point)
11. [Frontend UI — HTML Structure](#11-frontend-ui--html-structure)
12. [Frontend UI — CSS Styling](#12-frontend-ui--css-styling)
13. [Frontend UI — JavaScript Client](#13-frontend-ui--javascript-client)
14. [Interconnection Summary](#14-interconnection-summary)

---

## 1. Technology Stack

| Layer       | Technology             | Version  | Purpose                               |
|-------------|------------------------|----------|---------------------------------------|
| Runtime     | Node.js                | ≥ 18     | Server-side JavaScript execution      |
| Framework   | Express.js             | ^4.18    | HTTP routing and middleware            |
| Database    | MongoDB + Mongoose     | ^7.5     | Persistent document storage with ODM  |
| AI API      | OpenAI Node SDK        | ^4.11    | GPT-4 chat completions                |
| File Upload | Multer                 | ^1.4     | Multipart form parsing, memory storage|
| PDF Parsing | pdf-parse              | ^1.1     | Extract text from PDF buffers         |
| Security    | Helmet + express-rate-limit | latest | HTTP hardening and rate limiting  |
| Frontend    | Bootstrap 5 + Font Awesome | CDN  | Responsive UI components              |
| Validation  | express-validator      | ^7.0     | Input sanitization (extensible)       |

---

## 2. Project Initialization

### 2.1 Directory Structure

Create the following directory and file tree:

```
ai-resume-reviewer/
├── server.js
├── package.json
├── .env
├── middleware/
│   ├── errorHandler.js
│   └── upload.js
├── models/
│   └── Resume.js
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── routes/
│   └── resume.js
└── services/
    ├── openaiService.js
    └── textExtractionService.js
```

### 2.2 Initialize npm and Install Dependencies

```bash
npm init -y
npm install express mongoose cors helmet express-rate-limit express-validator multer pdf-parse openai dotenv
npm install --save-dev nodemon jest supertest
```

### 2.3 Add Scripts to `package.json`

```json
{
  "name": "ai-resume-reviewer",
  "version": "1.0.0",
  "description": "AI-powered resume reviewer that evaluates tone, formatting, and clarity",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-rate-limit": "^6.10.0",
    "express-validator": "^7.0.1",
    "helmet": "^7.0.0",
    "mongoose": "^7.5.0",
    "multer": "^1.4.5-lts.1",
    "openai": "^4.11.1",
    "pdf-parse": "^1.1.1"
  },
  "devDependencies": {
    "jest": "^29.6.4",
    "nodemon": "^3.0.1",
    "supertest": "^7.1.4"
  }
}
```

---

## 3. Environment Configuration

Create a `.env` file in the project root. **Never commit this file to version control.**

```env
# MongoDB connection string (local or Atlas)
MONGODB_URI=mongodb://localhost:27017/ai-resume-reviewer

# OpenAI credentials
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# Server
PORT=3000
NODE_ENV=development

# AI limits
MAX_TOKENS=2000

# File upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=application/pdf,text/plain

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10
```

**Rules:**
- `MONGODB_URI` must point to a running MongoDB instance (local) or a MongoDB Atlas cluster URI.
- `OPENAI_API_KEY` must be a valid secret key from [platform.openai.com](https://platform.openai.com).
- Add `.env` to `.gitignore` immediately.

---

## 4. Database Layer — MongoDB Schema

**File:** `models/Resume.js`

Define a Mongoose schema that stores the uploaded filename, extracted resume text, and the full AI analysis object.

```javascript
const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  originalText: {
    type: String,
    required: true
  },
  analysis: {
    toneScore:        { type: Number, min: 0, max: 10 },
    formattingScore:  { type: Number, min: 0, max: 10 },
    clarityScore:     { type: Number, min: 0, max: 10 },
    overallScore:     { type: Number, min: 0, max: 10 },
    strengths:        [String],
    weaknesses:       [String],
    suggestions:      [String],
    detailedFeedback: String,
    analyzedAt:       Date
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

// Descending index on uploadedAt for efficient recency queries
resumeSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);
```

**Key decisions:**
- `analysis` is a nested subdocument — no separate collection needed, simplifying queries.
- `uploadedAt` uses `default: Date.now` so the server always controls this timestamp.
- `analyzedAt` is set explicitly in the route after AI completes, enabling latency tracking.

---

## 5. File Upload Middleware

**File:** `middleware/upload.js`

Use Multer with **memory storage** (no disk I/O). Enforce MIME type and file size limits at the middleware layer before any application logic runs.

```javascript
const multer = require('multer');

// Store uploaded file as a Buffer in memory — never write to disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = (
    process.env.ALLOWED_FILE_TYPES || 'application/pdf,text/plain'
  ).split(',');

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type ${file.mimetype} is not allowed. ` +
        `Supported types: ${allowedTypes.join(', ')}`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024
  },
  fileFilter
});

// Named export wraps multer to produce structured JSON errors
const uploadMiddleware = (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size too large. Maximum size is 5MB.'
        });
      }
      return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please select a resume file.'
      });
    }
    next();
  });
};

module.exports = { uploadMiddleware };
```

**How it connects:**
- `upload.single('resume')` expects the FormData field to be named `resume` — this matches the frontend `formData.append('resume', file)` call exactly.
- After this middleware runs, `req.file.buffer` contains the raw file bytes for downstream processing.

---

## 6. Text Extraction Service

**File:** `services/textExtractionService.js`

Converts a raw file buffer into a clean string, regardless of whether the source is PDF or plain text.

```javascript
const pdfParse = require('pdf-parse');

class TextExtractionService {

  // Entry point — dispatches by MIME type
  async extractText(buffer, mimetype, filename) {
    try {
      switch (mimetype) {
        case 'application/pdf':
          return await this.extractFromPDF(buffer);
        case 'text/plain':
          return buffer.toString('utf-8');
        default:
          throw new Error(`Unsupported file type: ${mimetype}`);
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      throw new Error(`Failed to extract text from ${filename}`);
    }
  }

  // PDF-specific path: uses pdf-parse library
  async extractFromPDF(buffer) {
    const data = await pdfParse(buffer);
    return data.text;
  }

  // Validates that extracted text is non-empty and within processable bounds
  validateExtractedText(text) {
    if (!text || text.trim().length === 0)
      throw new Error('No text content found in the uploaded file');
    if (text.length < 50)
      throw new Error('Resume content appears to be too short for meaningful analysis');
    if (text.length > 50000)
      throw new Error('Resume content is too long for analysis');
    return true;
  }

  // Normalizes whitespace to reduce token usage
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }
}

module.exports = new TextExtractionService();
```

**Call sequence in the route:**
1. `extractText(req.file.buffer, req.file.mimetype, req.file.originalname)`
2. `validateExtractedText(extractedText)`
3. `cleanText(extractedText)` → pass to OpenAI

---

## 7. OpenAI Integration Service

**File:** `services/openaiService.js`

Encapsulates all communication with the OpenAI Chat Completions API. Constructs a deterministic prompt with an explicit JSON schema, calls the API, and parses the structured response.

```javascript
const OpenAI = require('openai');

class OpenAIService {

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  // Main method called by the route
  async analyzeResume(resumeText) {
    const prompt = this.createAnalysisPrompt(resumeText);
    const completion = await this.openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: parseInt(process.env.MAX_TOKENS) || 2000,
      temperature: 0.3   // Low temperature → consistent, repeatable scoring
    });
    const responseText = completion.choices[0].message.content;
    return this.parseAnalysisResponse(responseText);
  }

  // Constructs the prompt that instructs GPT-4 to return strict JSON
  createAnalysisPrompt(resumeText) {
    return `
Please analyze the following resume and provide a comprehensive evaluation.
Rate each category from 1-10 and provide specific feedback.

RESUME TEXT:
${resumeText}

Respond ONLY with a JSON object in exactly this format:
{
  "toneScore": <integer 1-10>,
  "formattingScore": <integer 1-10>,
  "clarityScore": <integer 1-10>,
  "overallScore": <integer 1-10>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "detailedFeedback": "Detailed paragraph explaining the analysis."
}

SCORING RUBRICS:
TONE (1-10): Professional language, appropriate confidence, industry terminology, no casual language.
FORMATTING (1-10): Clear sections, consistent formatting, logical flow, contact info placement.
CLARITY (1-10): Concise descriptions, quantified achievements, easy to scan, grammar accuracy.
`;
  }

  // Extracts the JSON block from the model's text response
  parseAnalysisResponse(response) {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    // Fallback: attempt direct parse
    return JSON.parse(response);
  }
}

module.exports = new OpenAIService();
```

**API call parameters explained:**
- `model: 'gpt-4'` — Most capable model for nuanced language evaluation; override via `OPENAI_MODEL` env var.
- `temperature: 0.3` — Near-deterministic output; critical for scoring consistency across identical resumes.
- `max_tokens: 2000` — Sufficient for full JSON payload including detailed feedback paragraph.
- The prompt explicitly demands a JSON object so `parseAnalysisResponse` can reliably extract it with a regex.

---

## 8. REST API Routes

**File:** `routes/resume.js`

All business logic orchestration lives here. Import the model, services, and middleware and wire them together into four endpoints.

```javascript
const express = require('express');
const Resume = require('../models/Resume');
const openaiService = require('../services/openaiService');
const textExtractionService = require('../services/textExtractionService');
const { uploadMiddleware } = require('../middleware/upload');

const router = express.Router();

// POST /api/resume/analyze
// Accepts multipart/form-data with field name "resume"
router.post('/analyze', uploadMiddleware, async (req, res, next) => {
  try {
    // Step 1: Extract text from the uploaded buffer
    const extractedText = await textExtractionService.extractText(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname
    );

    // Step 2: Validate and clean
    textExtractionService.validateExtractedText(extractedText);
    const cleanedText = textExtractionService.cleanText(extractedText);

    // Step 3: Call OpenAI
    const analysis = await openaiService.analyzeResume(cleanedText);

    // Step 4: Persist to MongoDB
    const resume = new Resume({
      fileName: req.file.originalname,
      originalText: cleanedText,
      analysis: { ...analysis, analyzedAt: new Date() }
    });
    await resume.save();

    // Step 5: Return structured response
    res.json({
      success: true,
      data: {
        id: resume._id,
        fileName: resume.fileName,
        analysis: resume.analysis,
        uploadedAt: resume.uploadedAt
      }
    });
  } catch (error) {
    next(error);  // Passes to errorHandler middleware
  }
});

// GET /api/resume/analysis/:id
// Retrieve a full analysis by MongoDB ObjectId
router.get('/analysis/:id', async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume analysis not found' });
    }
    res.json({
      success: true,
      data: {
        id: resume._id,
        fileName: resume.fileName,
        analysis: resume.analysis,
        uploadedAt: resume.uploadedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/resume/recent?limit=10&skip=0
// Returns summary list of recent analyses (no full text, no detailed feedback)
router.get('/recent', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip  = parseInt(req.query.skip)  || 0;
    const resumes = await Resume.find()
      .select('fileName analysis.overallScore uploadedAt')
      .sort({ uploadedAt: -1 })
      .limit(limit)
      .skip(skip);

    res.json({
      success: true,
      data: resumes.map(r => ({
        id: r._id,
        fileName: r.fileName,
        overallScore: r.analysis?.overallScore,
        uploadedAt: r.uploadedAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/resume/analysis/:id
router.delete('/analysis/:id', async (req, res, next) => {
  try {
    const resume = await Resume.findByIdAndDelete(req.params.id);
    if (!resume) {
      return res.status(404).json({ success: false, error: 'Resume analysis not found' });
    }
    res.json({ success: true, message: 'Analysis deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
```

---

## 9. Error Handling Middleware

**File:** `middleware/errorHandler.js`

A centralized error handler that converts any thrown error into a consistent JSON response. Must be registered as the **last** middleware in `server.js`.

```javascript
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: Object.values(err.errors).map(e => e.message).join(', ')
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format'
    });
  }

  // Default 500
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
};

// Optional: express-validator result handler
const validateRequest = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

module.exports = { errorHandler, validateRequest };
```

---

## 10. Express Server Entry Point

**File:** `server.js`

Assembles all middleware and routes, connects to MongoDB, and starts listening.

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const resumeRoutes  = require('./routes/resume');
const { errorHandler } = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// 1. Security headers
app.use(helmet());

// 2. API rate limiting — 10 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10,
  message:  'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// 3. General middleware
app.use(cors());
app.use(express.json());

// 4. Serve static frontend from /public
app.use(express.static('public'));

// 5. MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// 6. Mount API routes
app.use('/api/resume', resumeRoutes);

// 7. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 8. Centralized error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
```

---

## 11. Frontend UI — HTML Structure

**File:** `public/index.html`

A single-page application using Bootstrap 5 (CDN). The page has four logical sections:
1. **Navigation bar** — sticky top bar with brand name and nav links.
2. **Hero / Upload section** — file input form that POSTs to `/api/resume/analyze`.
3. **Results section** — hidden until analysis returns; shows score cards and feedback lists.
4. **Recent analyses section** — auto-populated list from `/api/resume/recent`.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Resume Reviewer</title>
  <!-- Bootstrap 5 CSS -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <!-- Font Awesome icons -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>

  <!-- Navbar -->
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
    <div class="container">
      <a class="navbar-brand" href="#">
        <i class="fas fa-file-alt me-2"></i>AI Resume Reviewer
      </a>
      <div class="navbar-nav ms-auto">
        <a class="nav-link" href="#upload">Upload</a>
        <a class="nav-link" href="#recent">Recent</a>
      </div>
    </div>
  </nav>

  <!-- Upload Section -->
  <section id="upload" class="py-5">
    <div class="container">
      <h1 class="text-center mb-4">Analyze Your Resume</h1>

      <!-- Error alert (hidden by default) -->
      <div id="errorAlert" class="alert alert-danger d-none" role="alert">
        <button type="button" class="btn-close float-end"></button>
        <span id="errorMessage"></span>
      </div>

      <form id="resumeForm" class="card p-4 shadow-sm">
        <div class="mb-3">
          <label for="resumeFile" class="form-label">Upload Resume (PDF or TXT, max 5MB)</label>
          <input type="file" class="form-control" id="resumeFile" accept=".pdf,.txt" required>
        </div>
        <button type="submit" id="submitBtn" class="btn btn-primary w-100">
          <i class="fas fa-magic me-2"></i>Analyze Resume
        </button>
      </form>

      <!-- Loading spinner (hidden by default) -->
      <div id="loadingSection" class="text-center mt-4" style="display:none;">
        <div class="spinner-border text-primary" role="status"></div>
        <p class="mt-2">Analyzing your resume with AI...</p>
      </div>
    </div>
  </section>

  <!-- Results Section (hidden until analysis returns) -->
  <section id="results" class="py-5 bg-light" style="display:none;">
    <div class="container">
      <h2 class="text-center mb-4">Analysis Results</h2>

      <!-- Score cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card text-center p-3 score-card" id="overallCard">
            <h6>Overall Score</h6>
            <h2 id="overallScore">-</h2>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center p-3 score-card" id="toneCard">
            <h6>Tone</h6>
            <h2 id="toneScore">-</h2>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center p-3 score-card" id="formattingCard">
            <h6>Formatting</h6>
            <h2 id="formattingScore">-</h2>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center p-3 score-card" id="clarityCard">
            <h6>Clarity</h6>
            <h2 id="clarityScore">-</h2>
          </div>
        </div>
      </div>

      <!-- Strengths, Weaknesses, Suggestions -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card p-3 h-100">
            <h5><i class="fas fa-check-circle text-success me-2"></i>Strengths</h5>
            <ul id="strengthsList" class="mt-2"></ul>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card p-3 h-100">
            <h5><i class="fas fa-exclamation-circle text-warning me-2"></i>Weaknesses</h5>
            <ul id="weaknessesList" class="mt-2"></ul>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card p-3 h-100">
            <h5><i class="fas fa-lightbulb text-info me-2"></i>Suggestions</h5>
            <ul id="suggestionsList" class="mt-2"></ul>
          </div>
        </div>
      </div>

      <!-- Detailed Feedback -->
      <div class="card p-4">
        <h5>Detailed Feedback</h5>
        <p id="detailedFeedback" class="mt-2"></p>
      </div>
    </div>
  </section>

  <!-- Recent Analyses Section -->
  <section id="recent" class="py-5">
    <div class="container">
      <h2 class="mb-4">Recent Analyses</h2>
      <div id="recentList" class="list-group"></div>
    </div>
  </section>

  <!-- Bootstrap JS -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

---

## 12. Frontend UI — CSS Styling

**File:** `public/css/style.css`

Minimal custom styles layered on top of Bootstrap. Score cards use background color to signal quality (green = high, red = low).

```css
/* Score card color coding */
.score-card { border-radius: 8px; }
.score-card.excellent { background-color: #d4edda; border-color: #c3e6cb; }
.score-card.good      { background-color: #d1ecf1; border-color: #bee5eb; }
.score-card.fair      { background-color: #fff3cd; border-color: #ffeeba; }
.score-card.poor      { background-color: #f8d7da; border-color: #f5c6cb; }

/* General layout */
body { background-color: #f8f9fa; }

section { min-height: 30vh; }

.card { border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

/* Loading overlay */
#loadingSection .spinner-border { width: 3rem; height: 3rem; }
```

---

## 13. Frontend UI — JavaScript Client

**File:** `public/js/app.js`

All frontend logic is encapsulated in a single `ResumeAnalyzer` class. It handles form submission, file validation, API calls, DOM rendering, and loading states.

```javascript
class ResumeAnalyzer {
  constructor() {
    this.apiBase = '/api';
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadRecentAnalyses();
  }

  bindEvents() {
    // Form submit → trigger analysis
    document.getElementById('resumeForm')
      .addEventListener('submit', (e) => { e.preventDefault(); this.analyzeResume(); });

    // File change → client-side validation feedback
    document.getElementById('resumeFile')
      .addEventListener('change', (e) => { this.validateFile(e.target); });

    // Error alert close button
    document.getElementById('errorAlert')
      .addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-close')) this.hideError();
      });
  }

  // Client-side pre-flight validation (mirrors server validation)
  validateFile(input) {
    const file = input.files[0];
    if (!file) return false;
    if (file.size > 5 * 1024 * 1024) {
      this.showError('File size exceeds 5MB limit.'); input.value = ''; return false;
    }
    const allowed = ['application/pdf', 'text/plain'];
    if (!allowed.includes(file.type)) {
      this.showError('Please select a PDF or TXT file.'); input.value = ''; return false;
    }
    return true;
  }

  // Sends FormData to POST /api/resume/analyze
  async analyzeResume() {
    const fileInput = document.getElementById('resumeFile');
    if (!fileInput.files[0] || !this.validateFile(fileInput)) return;

    try {
      this.showLoading();
      this.hideError();
      this.hideResults();

      const formData = new FormData();
      // Field name MUST be "resume" to match uploadMiddleware's upload.single('resume')
      formData.append('resume', fileInput.files[0]);

      const response = await fetch(`${this.apiBase}/resume/analyze`, {
        method: 'POST',
        body: formData
        // Do NOT set Content-Type header — browser sets it with boundary for multipart
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analysis failed');

      this.hideLoading();
      this.showResults(data.data);
      this.loadRecentAnalyses();
    } catch (error) {
      this.hideLoading();
      this.showError(error.message || 'An error occurred during analysis.');
    }
  }

  // Renders analysis data into the results section
  showResults(data) {
    const a = data.analysis;
    document.getElementById('overallScore').textContent    = `${a.overallScore}/10`;
    document.getElementById('toneScore').textContent       = `${a.toneScore}/10`;
    document.getElementById('formattingScore').textContent = `${a.formattingScore}/10`;
    document.getElementById('clarityScore').textContent    = `${a.clarityScore}/10`;

    // Color-code score cards
    const colorClass = (score) =>
      score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'fair' : 'poor';
    document.getElementById('overallCard').className    = `card text-center p-3 score-card ${colorClass(a.overallScore)}`;
    document.getElementById('toneCard').className       = `card text-center p-3 score-card ${colorClass(a.toneScore)}`;
    document.getElementById('formattingCard').className = `card text-center p-3 score-card ${colorClass(a.formattingScore)}`;
    document.getElementById('clarityCard').className    = `card text-center p-3 score-card ${colorClass(a.clarityScore)}`;

    // Populate lists
    ['strengths', 'weaknesses', 'suggestions'].forEach(key => {
      const el = document.getElementById(`${key}List`);
      el.innerHTML = '';
      (a[key] || []).forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        el.appendChild(li);
      });
    });

    document.getElementById('detailedFeedback').textContent = a.detailedFeedback;
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
  }

  // Fetches and renders the recent analyses list
  async loadRecentAnalyses() {
    try {
      const response = await fetch(`${this.apiBase}/resume/recent?limit=5`);
      const data = await response.json();
      const el = document.getElementById('recentList');
      el.innerHTML = '';
      if (!data.data || data.data.length === 0) {
        el.innerHTML = '<p class="text-muted">No analyses yet.</p>';
        return;
      }
      data.data.forEach(item => {
        const div = document.createElement('a');
        div.className = 'list-group-item list-group-item-action d-flex justify-content-between';
        div.href = '#';
        div.innerHTML = `
          <span>${item.fileName}</span>
          <span class="badge bg-primary">${item.overallScore}/10</span>
        `;
        el.appendChild(div);
      });
    } catch (e) {
      console.error('Failed to load recent analyses', e);
    }
  }

  showLoading() {
    document.getElementById('loadingSection').style.display = 'block';
    const btn = document.getElementById('submitBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Analyzing...';
  }

  hideLoading() {
    document.getElementById('loadingSection').style.display = 'none';
    const btn = document.getElementById('submitBtn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-magic me-2"></i>Analyze Resume';
  }

  showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorAlert').classList.remove('d-none');
  }

  hideError() { document.getElementById('errorAlert').classList.add('d-none'); }

  hideResults() { document.getElementById('results').style.display = 'none'; }
}

// Instantiate on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => new ResumeAnalyzer());
```

---

## 14. Interconnection Summary

The table below maps each user action to the full call chain through the system.

| User Action               | Frontend                            | API Route                  | Service(s)                                      | Database        | External API   |
|---------------------------|-------------------------------------|----------------------------|-------------------------------------------------|-----------------|----------------|
| Select and submit file    | `FormData.append('resume', file)` → `fetch POST /api/resume/analyze` | `POST /analyze` + `uploadMiddleware` | `textExtractionService.extractText()` → `openaiService.analyzeResume()` | `resume.save()` | OpenAI GPT-4   |

| Page load / after upload  | `fetch GET /api/resume/recent`      | `GET /recent`              | —                                               | `Resume.find()` | —              |

| View past result (by ID)  | `fetch GET /api/resume/analysis/:id`| `GET /analysis/:id`        | —                                               | `Resume.findById()` | —          |

| Delete a result           | `fetch DELETE /api/resume/analysis/:id` | `DELETE /analysis/:id` | —                                               | `Resume.findByIdAndDelete()` | — |

### Running the Application

```bash
# 1. Install dependencies
npm install

# 2. Create and populate .env (see Section 3)

# 3. Ensure MongoDB is running (local) or set Atlas URI

# 4. Start the server
npm run dev     # development (nodemon)
# or
npm start       # production

# 5. Open browser to http://localhost:3000
```
