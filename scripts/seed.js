const mongoose = require('mongoose');
const Resume = require('../models/Resume');
const { generateRandomAnalysis } = require('../utils/testData');
require('dotenv').config();

const sampleResumes = [
  {
    fileName: 'software_engineer.pdf',
    text: 'John Smith - Senior Software Engineer with 8 years experience in full-stack development...'
  },
  {
    fileName: 'marketing_manager.pdf', 
    text: 'Sarah Johnson - Marketing Manager with expertise in digital marketing and brand strategy...'
  },
  {
    fileName: 'data_scientist.txt',
    text: 'Mike Chen - Data Scientist specializing in machine learning and statistical analysis...'
  },
  {
    fileName: 'product_manager.pdf',
    text: 'Emily Davis - Product Manager with track record of launching successful products...'
  },
  {
    fileName: 'ui_designer.pdf',
    text: 'Alex Rodriguez - UI/UX Designer passionate about creating intuitive user experiences...'
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with sample data...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear existing data
    await Resume.deleteMany({});
    console.log('🧹 Cleared existing data');
    
    // Create sample resumes
    for (const sample of sampleResumes) {
      const resume = new Resume({
        fileName: sample.fileName,
        originalText: sample.text,
        analysis: generateRandomAnalysis(),
        uploadedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
        analyzedAt: new Date()
      });
      
      await resume.save();
      console.log(`📄 Created: ${sample.fileName}`);
    }
    
    console.log('✅ Database seeded successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedDatabase();