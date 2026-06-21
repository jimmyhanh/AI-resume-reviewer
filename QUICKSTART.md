# Quick Start Guide

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v14+)
- MongoDB running locally or MongoDB Atlas account
- OpenAI API key

### 2. Setup Steps

```bash
# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Edit .env file with your OpenAI API key
# OPENAI_API_KEY=your_actual_api_key_here

# Set up database and sample data
npm run setup

# Start development server
npm run dev
```

### 3. Open Your Browser
Visit `http://localhost:3000` to see your AI Resume Reviewer!

## 🔧 Configuration

### Required Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key (required)
- `MONGODB_URI`: MongoDB connection string

### Optional Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (default: development)
- `OPENAI_MODEL`: AI model to use (default: gpt-4)

## 📁 Key Files

- `server.js` - Main application entry point
- `public/index.html` - Frontend interface
- `routes/resume.js` - API endpoints
- `services/openaiService.js` - AI integration
- `models/Resume.js` - Database schema

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Seed database with sample data
npm run seed
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Make sure MongoDB is running
   - Check your MONGODB_URI in .env

2. **OpenAI API Error**
   - Verify your API key is correct
   - Check your OpenAI account has credits

3. **File Upload Issues**
   - Ensure file is PDF or TXT
   - Check file size is under 5MB

4. **Port Already in Use**
   - Change PORT in .env file
   - Kill process using the port: `netstat -ano | findstr :3000`

## 📊 Features

- ✅ Upload PDF/TXT resumes
- ✅ AI-powered analysis
- ✅ Scoring system (1-10)
- ✅ Detailed feedback
- ✅ Recent analyses tracking
- ✅ Platform statistics
- ✅ Responsive design
- ✅ Error handling
- ✅ Rate limiting

## 🚢 Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use production MongoDB instance
3. Configure proper SSL/HTTPS
4. Set up process manager (PM2)
5. Configure reverse proxy (nginx)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request