# Logical Structure Document

## System Architecture Overview

AI Resume Reviewer follows a **three-tier MVC architecture**: a static HTML/CSS/JS frontend, a Node.js/Express REST API backend, and a MongoDB database layer. The OpenAI API serves as an external AI service dependency.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  index.html  │  │  style.css   │  │      app.js        │    │
│  │  (Bootstrap) │  │  (Styling)   │  │  (ResumeAnalyzer   │    │
│  │              │  │              │  │   class / Fetch API)│   │
│  └──────────────┘  └──────────────┘  └────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────┘
                               │  HTTP/REST (multipart/form-data & JSON)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NODE.JS / EXPRESS SERVER                      │
│                          server.js                              │
│                                                                 │
│  ┌────────────────────┐    ┌──────────────────────────────────┐ │
│  │     MIDDLEWARE     │    │           ROUTES                 │ │
│  │  ─ helmet (security│    │       routes/resume.js           │ │
│  │  ─ cors            │    │                                  │ │
│  │  ─ rate limiter    │    │  POST /api/resume/analyze        │ │
│  │  ─ multer (upload) │    │  GET  /api/resume/analysis/:id   │ │
│  │  ─ errorHandler    │    │  GET  /api/resume/recent         │ │
│  └────────────────────┘    │  DELETE /api/resume/analysis/:id │ │
│                            │  GET  /api/health                │ │
│                            └──────────────────────────────────┘ │
│                                        │                        │
│              ┌─────────────────────────┴────────────┐           │
│              │                                      │           │
│              ▼                                      ▼           │
│  ┌───────────────────────┐          ┌─────────────────────────┐ │
│  │  textExtractionService│          │     openaiService       │ │
│  │  ─ extractText()      │          │  ─ analyzeResume()      │ │
│  │  ─ extractFromPDF()   │          │  ─ createPrompt()       │ │
│  │  ─ validateText()     │          │  ─ parseResponse()      │ │
│  │  ─ cleanText()        │          │                         │ │
│  └───────────────────────┘          └─────────────────────────┘ │
└────────────────────┬─────────────────────────────┬──────────────┘
                     │                             │
                     ▼                             ▼
        ┌────────────────────┐        ┌────────────────────────┐
        │      MONGODB       │        │     OPENAI API          │
        │   (Mongoose ODM)   │        │   GPT-4 Chat Model      │
        │                    │        │                         │
        │  Collection:       │        │  Input: resume text     │
        │  resumes           │        │  Output: JSON scores,   │
        │  ─ fileName        │        │  strengths, weaknesses, │
        │  ─ originalText    │        │  suggestions, feedback  │
        │  ─ analysis{}      │        └────────────────────────┘
        │  ─ uploadedAt      │
        │  ─ analyzedAt      │
        └────────────────────┘
```

---

## Data Flow Diagram

### Primary Flow: Resume Upload & Analysis

```
User selects file (PDF/TXT)
         │
         ▼
[Frontend validates: type & size ≤ 5MB]
         │
         ▼
FormData POST → /api/resume/analyze
         │
         ▼
[Multer middleware intercepts multipart request]
[Stores file in memory buffer (no disk write)]
         │
         ▼
[textExtractionService.extractText(buffer, mimetype)]
  ├── PDF  → pdf-parse → raw text string
  └── TXT  → buffer.toString('utf-8')
         │
         ▼
[validateExtractedText: length 50–50,000 chars]
[cleanText: normalize whitespace]
         │
         ▼
[openaiService.analyzeResume(cleanedText)]
  └── Constructs structured prompt with scoring rubric
  └── Calls OpenAI Chat Completions API (GPT-4)
  └── Parses JSON from response string
         │
         ▼
[new Resume({fileName, originalText, analysis})]
[resume.save() → MongoDB]
         │
         ▼
JSON response → client
{
  success: true,
  data: { id, fileName, analysis, uploadedAt }
}
         │
         ▼
[Frontend renders score cards, strengths,
 weaknesses, suggestions, detailed feedback]
```

### Secondary Flow: Retrieve Past Analysis

```
User requests history → GET /api/resume/recent
         │
         ▼
[MongoDB query: find().sort({uploadedAt:-1}).limit(n)]
         │
         ▼
Returns: [{ id, fileName, overallScore, uploadedAt }]
         │
         ▼
Frontend renders recent analyses list
```

---

## Module Dependency Map

```
server.js
├── routes/resume.js
│   ├── middleware/upload.js          (multer memory storage)
│   ├── middleware/errorHandler.js    (validateRequest, errorHandler)
│   ├── models/Resume.js             (Mongoose schema)
│   ├── services/textExtractionService.js  (pdf-parse, utf-8)
│   └── services/openaiService.js    (openai SDK)
└── middleware/errorHandler.js
```

---

## Database Schema

**Collection:** `resumes`

| Field                    | Type     | Constraints            | Description                          |
|--------------------------|----------|------------------------|--------------------------------------|
| `_id`                    | ObjectId | Auto-generated         | MongoDB primary key                  |
| `fileName`               | String   | Required               | Original uploaded filename           |
| `originalText`           | String   | Required               | Cleaned, extracted resume text       |
| `analysis.toneScore`     | Number   | 0–10                   | AI-scored professional tone          |
| `analysis.formattingScore` | Number | 0–10                   | AI-scored formatting quality         |
| `analysis.clarityScore`  | Number   | 0–10                   | AI-scored clarity and readability    |
| `analysis.overallScore`  | Number   | 0–10                   | AI-scored overall quality            |
| `analysis.strengths`     | [String] | Array                  | List of identified strengths         |
| `analysis.weaknesses`    | [String] | Array                  | List of identified weaknesses        |
| `analysis.suggestions`   | [String] | Array                  | List of actionable recommendations   |
| `analysis.detailedFeedback` | String | —                   | Full narrative paragraph from AI     |
| `uploadedAt`             | Date     | Default: now           | Record creation timestamp            |
| `analyzedAt`             | Date     | —                      | AI analysis completion timestamp     |

**Index:** `{ uploadedAt: -1 }` for efficient recency-sorted queries.

---

## API Endpoint Reference

| Method   | Endpoint                      | Description                        | Auth |
|----------|-------------------------------|------------------------------------|------|
| `POST`   | `/api/resume/analyze`         | Upload and analyze a resume file   | None |
| `GET`    | `/api/resume/analysis/:id`    | Retrieve a single analysis by ID   | None |
| `GET`    | `/api/resume/recent`          | List recent analyses (paginated)   | None |
| `DELETE` | `/api/resume/analysis/:id`    | Delete an analysis record          | None |
| `GET`    | `/api/health`                 | Server health check                | None |

---

## Security Controls

| Layer          | Control                                                                 |
|----------------|-------------------------------------------------------------------------|
| HTTP Headers   | `helmet` sets secure Content-Security-Policy, HSTS, X-Frame-Options     |
| Rate Limiting  | 10 requests per 15-minute window per IP via `express-rate-limit`        |
| File Validation| MIME type allowlist (PDF, TXT only); 5 MB size cap enforced by multer   |
| Storage        | Files held in memory buffer only — never written to disk                |
| Input Length   | Resume text capped at 50,000 characters before AI submission            |
