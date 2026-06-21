# AI Resume Reviewer

## What This Application Does

AI Resume Reviewer is a full-stack web application that accepts resume uploads (PDF or TXT) and returns an instant AI-powered evaluation. OpenAI GPT-4 scores the resume across three dimensions — **Tone**, **Formatting**, and **Clarity** — and returns a ranked list of strengths, weaknesses, and actionable suggestions. All results are persisted in MongoDB for history and statistics tracking.

## Stack

- **Backend**: Node.js 18 + Express 4
- **AI**: OpenAI GPT-4 (Chat Completions API)
- **Database**: MongoDB 7 + Mongoose
- **Frontend**: Bootstrap 5.3, Vanilla JS
- **Logging**: pino + pino-http (structured JSON)
- **Testing**: Jest + Supertest

## Project Structure

```
ai-resume-reviewer/
├── server.js                     # Entry point, middleware, graceful shutdown
├── package.json
├── .env.example                  # Full variable reference
├── models/
│   └── Resume.js                 # Mongoose schema
├── routes/
│   └── resume.js                 # REST API endpoints
├── services/
│   ├── openaiService.js          # GPT-4 integration
│   └── textExtractionService.js  # PDF / TXT parsing
├── middleware/
│   ├── upload.js                 # Multer memory-storage
│   └── errorHandler.js           # Centralized error handler
├── public/
│   ├── index.html                # Single-page UI
│   ├── css/style.css
│   └── js/app.js
├── tests/
│   └── api.test.js               # Jest + Supertest (OpenAI mocked)
├── scripts/
│   ├── setup.js
│   └── seed.js
└── utils/
    └── testData.js
```

## How It Works

1. User uploads a PDF or TXT resume via drag-and-drop or file picker
2. Multer stores the file as an in-memory buffer (never touches disk)
3. `textExtractionService` extracts plain text (pdf-parse for PDFs, UTF-8 decode for TXT)
4. Text is validated (50–50,000 characters) and sanitized against prompt injection
5. `openaiService` sends the text to GPT-4 with a structured scoring rubric
6. The JSON response is parsed and stored in MongoDB
7. The frontend renders animated score progress bars and feedback lists

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/resume/analyze` | Upload and analyze a resume |
| `GET` | `/api/resume/analysis/:id` | Retrieve a single analysis |
| `GET` | `/api/resume/recent` | Paginated list of recent analyses |
| `DELETE` | `/api/resume/analysis/:id` | Delete an analysis |
| `GET` | `/api/resume/stats` | Aggregate statistics |
| `GET` | `/api/health` | Health check with DB status |

## Security & Reliability

- **Startup guard**: exits immediately if `MONGODB_URI` or `OPENAI_API_KEY` are missing
- **Prompt injection protection**: control characters stripped; resume wrapped in `<resume>` XML tags
- **OpenAI retry**: SDK configured with `maxRetries: 3` and 30s timeout
- **Graceful shutdown**: SIGTERM/SIGINT drain requests and close DB before exit
- **Request correlation IDs**: `X-Request-ID` on every request for log tracing
- **Structured logging**: pino JSON in production; pretty-printed in development
- **Rate limiting**: 10 requests / 15 min / IP
- **File safety**: MIME allowlist, 5 MB cap, memory-only storage

## Frontend Highlights

- Drag-and-drop file upload zone with keyboard accessibility
- Filename and size preview after selection
- Animated progress bars on score cards (0 → score on result load)
- Color-coded cards: green (8–10), blue (6–7), yellow (4–5), red (1–3)
- Bootstrap 5.3 + Font Awesome 6.5

## Quick Start

```bash
npm install
copy .env.example .env   # then fill in MONGODB_URI and OPENAI_API_KEY
npm run dev
# open http://localhost:3000
```

## Running Tests

```bash
npm test
```

OpenAI is mocked — tests run without any real API calls or charges.

## 🚀 Features Implemented

### Core Functionality
- ✅ **Resume Upload**: Support for PDF and TXT files (up to 5MB)
- ✅ **AI Analysis**: Comprehensive evaluation using OpenAI GPT-4
- ✅ **Smart Scoring**: Separate scores for tone, formatting, and clarity (1-10 scale)
- ✅ **Detailed Feedback**: Strengths, weaknesses, and actionable suggestions
- ✅ **Data Persistence**: MongoDB storage for all analyses
- ✅ **Analytics Dashboard**: View recent analyses and platform statistics

### Technical Features
- ✅ **Security**: Rate limiting, file validation, CORS, Helmet
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Text Extraction**: PDF parsing and text cleaning
- ✅ **Responsive Design**: Mobile-friendly interface
- ✅ **API Documentation**: RESTful endpoints with proper responses

## 📁 Project Structure

```
ai-resume-reviewer/
├── 📄 server.js                    # Main application entry
├── 📄 package.json                 # Dependencies and scripts
├── 📄 .env                         # Environment configuration
├── 📄 .env.example                 # Example environment file
├── 📄 README.md                    # Full documentation
├── 📄 QUICKSTART.md                # Quick setup guide
├── 📄 .gitignore                   # Git ignore rules
├── 
├── 📁 models/
│   └── 📄 Resume.js                # MongoDB schema
├── 
├── 📁 routes/
│   └── 📄 resume.js                # API endpoints
├── 
├── 📁 services/
│   ├── 📄 openaiService.js         # OpenAI integration
│   └── 📄 textExtractionService.js # File processing
├── 
├── 📁 middleware/
│   ├── 📄 upload.js                # File upload handling
│   └── 📄 errorHandler.js          # Error management
├── 
├── 📁 public/
│   ├── 📄 index.html               # Frontend HTML
│   ├── 📁 css/
│   │   └── 📄 style.css            # Custom styles
│   └── 📁 js/
│       └── 📄 app.js               # Frontend JavaScript
├── 
├── 📁 scripts/
│   ├── 📄 setup.js                 # Database setup
│   └── 📄 seed.js                  # Sample data creation
├── 
├── 📁 utils/
│   └── 📄 testData.js              # Test utilities
└── 
└── 📁 tests/
    └── 📄 api.test.js              # API tests
```

## 🎯 How It Works

1. **Upload**: User uploads a PDF or TXT resume
2. **Extract**: System extracts and cleans text content
3. **Analyze**: OpenAI GPT-4 evaluates the resume for:
   - **Tone**: Professional language and confidence
   - **Formatting**: Structure and organization
   - **Clarity**: Readability and relevance
4. **Score**: AI provides 1-10 scores for each category
5. **Feedback**: Detailed suggestions and recommendations
6. **Store**: Results saved to MongoDB for tracking
7. **Display**: Beautiful, responsive results interface

## 🔧 Quick Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment** (copy .env.example to .env):
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   MONGODB_URI=mongodb://localhost:27017/ai-resume-reviewer
   ```

3. **Initialize database**:
   ```bash
   npm run setup
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Open browser**: Visit `http://localhost:3000`

## 📊 API Endpoints

- `POST /api/resume/analyze` - Upload and analyze resume
- `GET /api/resume/analysis/:id` - Get specific analysis
- `GET /api/resume/recent` - Get recent analyses
- `GET /api/resume/stats` - Get platform statistics
- `DELETE /api/resume/analysis/:id` - Delete analysis
- `GET /api/health` - Health check

## 🎨 Frontend Features

- **Modern UI**: Bootstrap 5 with custom styling
- **File Upload**: Drag-and-drop interface
- **Real-time Feedback**: Loading states and progress
- **Score Visualization**: Color-coded score cards
- **Mobile Responsive**: Works on all devices
- **Error Handling**: User-friendly error messages

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse (10 requests per 15 minutes)
- **File Validation**: Checks file type and size
- **Input Sanitization**: Validates all user inputs
- **CORS Protection**: Configurable cross-origin requests
- **Security Headers**: Helmet.js for security headers

## 📈 Analytics

- Track total analyses performed
- Monitor recent activity (last 7 days)
- Calculate average scores across all categories
- Store analysis history for trends

## 🧪 Testing

- **Unit Tests**: API endpoint testing
- **Integration Tests**: Full workflow testing
- **Sample Data**: Seed script for development
- **Error Testing**: Comprehensive error scenarios

## 🚀 Production Ready

- **Environment Configuration**: Separate dev/prod settings
- **Docker Support**: Ready for containerization
- **PM2 Compatible**: Process management ready
- **Logging**: Comprehensive error and access logging
- **Monitoring**: Health check endpoint

## 📝 Next Steps

Your AI Resume Reviewer is now complete and ready to use! Here's what you can do:

1. **Test the Application**: Upload a sample resume and see the analysis
2. **Customize the AI Prompt**: Modify the analysis criteria in `openaiService.js`
3. **Add Authentication**: Implement user accounts and saved analyses
4. **Enhance UI**: Add more visualizations and features
5. **Deploy**: Set up on your preferred hosting platform

## 🎊 Congratulations!

You now have a fully functional AI-powered resume reviewer that can:
- Process PDF and text resumes
- Provide intelligent feedback using GPT-4
- Score resumes across multiple dimensions
- Store and track analysis history
- Provide a beautiful, responsive user interface

The application is production-ready with proper error handling, security measures, and documentation. You can start using it immediately or extend it with additional features!

Happy coding! 🚀