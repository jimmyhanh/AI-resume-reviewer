const mongoose = require('mongoose');
require('dotenv').config();

// Simple MongoDB connection test and fallback setup
async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('Connection string:', process.env.MONGODB_URI);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    
    console.log('✅ MongoDB connection successful!');
    await mongoose.connection.close();
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    console.log(`
🔧 SOLUTION OPTIONS:

Option 1: Use MongoDB Atlas (Cloud - Recommended)
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a cluster
4. Get your connection string
5. Update MONGODB_URI in .env file

Option 2: Start Local MongoDB
1. Open Command Prompt as Administrator
2. Run: net start MongoDB
3. Or manually start MongoDB from: C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe

Option 3: Use In-Memory Database (Development Only)
I can modify the app to use an in-memory database for testing.

Which option would you prefer?
    `);
    return false;
  }
}

testConnection();