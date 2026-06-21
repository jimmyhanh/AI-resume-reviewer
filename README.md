# AI Resume Reviewer

An AI-powered web application that analyzes resumes for tone, formatting, and clarity using OpenAI's GPT-4 model. Provides instant scored feedback with strengths, weaknesses, and actionable suggestions — all persisted in MongoDB.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js ≥ 18 |
| Framework | Express.js 4 |
| Database | MongoDB 7 + Mongoose |
| AI | OpenAI GPT-4 (Chat Completions) |
| Frontend | Bootstrap 5.3, Vanilla JS |
| File Processing | pdf-parse, multer (memory storage) |
| Logging | pino + pino-http (structured JSON) |
| Security | Helmet, express-rate-limit, CORS |

## Prerequisites

- Node.js v18 or higher
- MongoDB running locally or a MongoDB Atlas URI
- OpenAI API key

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-resume-reviewer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Windows
   copy .env.example .env
   # macOS / Linux
   cp .env.example .env
   ```
   Open `.env` and set at minimum:
   ```env
   MONGODB_URI=mongodb://localhost:27017/ai-resume-reviewer
   OPENAI_API_KEY=sk-...
   ```
   See `.env.example` for all available variables.

4. **Ensure MongoDB is running**
   Local: `mongod` — or use a MongoDB Atlas connection string.

5. **Start the application**
   ```bash
   # Development (nodemon + pretty logs)
   npm run dev

   # Production
   npm start
   ```

6. **Open** `http://localhost:3000`

## API Endpoints

### Resume Analysis
- `POST /api/resume/analyze` - Upload and analyze a resume
- `GET /api/resume/analysis/:id` - Get analysis by ID
- `GET /api/resume/recent` - Get recent analyses
- `DELETE /api/resume/analysis/:id` - Delete an analysis
- `GET /api/resume/stats` - Get platform statistics

### Health Check
- `GET /api/health` - Check API status

## Usage

1. **Upload Resume**: Select a PDF or TXT file using the upload form
2. **AI Analysis**: The system extracts text and sends it to OpenAI for analysis
3. **View Results**: Get detailed scores and feedback on:
   - **Tone**: Professional language and confidence level
   - **Formatting**: Structure, organization, and presentation
   - **Clarity**: Readability, conciseness, and relevance
4. **Review Suggestions**: Implement the AI-generated recommendations
5. **Track Progress**: View analytics and previous analyses

## Project Structure

```
ai-resume-reviewer/
├── models/
│   └── Resume.js              # MongoDB schema
├── routes/
│   └── resume.js             # API routes
├── services/
│   ├── openaiService.js         # OpenAI GPT-4 integration (retry, sanitization)
│   └── textExtractionService.js # PDF / TXT text extraction
├── middleware/
│   ├── upload.js                # Multer memory-storage upload
│   └── errorHandler.js          # Centralized error handler
├── public/
│   ├── index.html               # Single-page frontend
│   ├── css/style.css            # Custom styles
│   └── js/app.js               # ResumeAnalyzer class
├── tests/
│   └── api.test.js             # Jest + Supertest suite
├── server.js                   # Express entry point
├── package.json
├── .env                        # Secrets (gitignored)
└── .env.example                # Variable reference
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `LOG_LEVEL` | Pino log level | `info` |
| `MONGODB_URI` | MongoDB connection string | **Required** |
| `MONGODB_URI_TEST` | Test database URI (Jest) | `...ai-resume-reviewer-test` |
| `OPENAI_API_KEY` | OpenAI API key | **Required** |
| `OPENAI_MODEL` | OpenAI model | `gpt-4` |
| `MAX_TOKENS` | Max tokens for AI response | `2000` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `5242880` (5 MB) |
| `ALLOWED_FILE_TYPES` | Allowed MIME types | `application/pdf,text/plain` |
| `RATE_LIMIT_WINDOW_MS` | Rate-limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Requests per window per IP | `10` |

> **Note:** The server will refuse to start if `MONGODB_URI` or `OPENAI_API_KEY` are missing.

### File Upload Limits

- **Maximum file size**: 5MB
- **Supported formats**: PDF, TXT
- **Text length**: 50-50,000 characters after extraction

## Security Features

- **Startup Guard**: Process exits immediately if required env vars are missing
- **Rate Limiting**: 10 requests per 15 min per IP via `express-rate-limit`
- **File Validation**: MIME allowlist + 5 MB cap enforced by Multer before any app logic
- **Memory Storage**: Uploaded files are never written to disk
- **Helmet**: Secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
- **Prompt Injection Protection**: Resume text is sanitized and wrapped in XML delimiters before reaching the AI
- **CORS**: Configurable cross-origin policy
- **Structured Error Responses**: All errors return `{ success: false, error: "..." }` JSON

## Reliability Features

- **Graceful Shutdown**: `SIGTERM`/`SIGINT` drain in-flight requests and close the DB connection cleanly before exit
- **OpenAI Retry**: SDK configured with `maxRetries: 3` — transient API errors are retried automatically with exponential backoff
- **Request Correlation IDs**: Every request gets a `X-Request-ID` header (UUID) for end-to-end log tracing
- **DB Health in `/api/health`**: Returns `database: "connected"` and HTTP 503 when the DB is unreachable
- **Structured Logging**: `pino` outputs JSON in production; pretty-printed in development

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Production Setup

1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Configure proper rate limiting
4. Set up SSL/HTTPS
5. Use a process manager like PM2

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions:
- Create an issue in the repository
- Check the documentation
- Review the error logs

## Roadmap

- [ ] User authentication and profiles
- [ ] Resume comparison features
- [ ] Integration with job boards
- [ ] Additional file format support
- [ ] Real-time collaboration
- [ ] Mobile app development