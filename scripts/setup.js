const mongoose = require('mongoose');
const { createSampleResume } = require('../utils/testData');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('🚀 Setting up AI Resume Reviewer...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Create sample data
    console.log('📄 Creating sample resume data...');
    await createSampleResume();
    
    console.log('🎉 Setup completed successfully!');
    console.log(`
    🌟 Your AI Resume Reviewer is ready!
    
    📋 Next steps:
    1. Make sure you have a valid OpenAI API key in your .env file
    2. Start the server: npm run dev
    3. Open http://localhost:${process.env.PORT || 3000} in your browser
    4. Upload a resume and see the magic happen!
    
    📁 Project structure:
    - Frontend: public/index.html
    - Backend API: server.js
    - Database Models: models/
    - Services: services/
    
    🔧 Configuration:
    - Environment: ${process.env.NODE_ENV || 'development'}
    - Database: ${process.env.MONGODB_URI}
    - Port: ${process.env.PORT || 3000}
    `);

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

setupDatabase();