const express = require('express');
const { body } = require('express-validator');
const Resume = require('../models/Resume');
const openaiService = require('../services/openaiService');
const textExtractionService = require('../services/textExtractionService');
const { uploadMiddleware } = require('../middleware/upload');
const { validateRequest } = require('../middleware/errorHandler');

const router = express.Router();

// Upload and analyze resume
router.post('/analyze', uploadMiddleware, async (req, res, next) => {
  try {
    const { file } = req;
    
    // Extract text from uploaded file
    const extractedText = await textExtractionService.extractText(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    // Validate extracted text
    textExtractionService.validateExtractedText(extractedText);
    
    // Clean the text
    const cleanedText = textExtractionService.cleanText(extractedText);

    // Analyze with OpenAI
    const analysis = await openaiService.analyzeResume(cleanedText);

    // Save to database
    const resume = new Resume({
      fileName: file.originalname,
      originalText: cleanedText,
      analysis: {
        ...analysis,
        analyzedAt: new Date()
      }
    });

    await resume.save();

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

// Get analysis by ID
router.get('/analysis/:id', async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume analysis not found'
      });
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

// Get recent analyses
router.get('/recent', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const skip = parseInt(req.query.skip) || 0;

    const resumes = await Resume.find()
      .select('fileName analysis.overallScore uploadedAt')
      .sort({ uploadedAt: -1 })
      .limit(limit)
      .skip(skip);

    res.json({
      success: true,
      data: resumes.map(resume => ({
        id: resume._id,
        fileName: resume.fileName,
        overallScore: resume.analysis?.overallScore,
        uploadedAt: resume.uploadedAt
      }))
    });

  } catch (error) {
    next(error);
  }
});

// Delete analysis
router.delete('/analysis/:id', async (req, res, next) => {
  try {
    const resume = await Resume.findByIdAndDelete(req.params.id);
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume analysis not found'
      });
    }

    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });

  } catch (error) {
    next(error);
  }
});

// Get analytics/stats
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await Resume.aggregate([
      {
        $group: {
          _id: null,
          totalAnalyses: { $sum: 1 },
          averageOverallScore: { $avg: '$analysis.overallScore' },
          averageToneScore: { $avg: '$analysis.toneScore' },
          averageFormattingScore: { $avg: '$analysis.formattingScore' },
          averageClarityScore: { $avg: '$analysis.clarityScore' }
        }
      }
    ]);

    const recentCount = await Resume.countDocuments({
      uploadedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        totalAnalyses: stats[0]?.totalAnalyses || 0,
        recentAnalyses: recentCount,
        averageScores: {
          overall: Number((stats[0]?.averageOverallScore || 0).toFixed(1)),
          tone: Number((stats[0]?.averageToneScore || 0).toFixed(1)),
          formatting: Number((stats[0]?.averageFormattingScore || 0).toFixed(1)),
          clarity: Number((stats[0]?.averageClarityScore || 0).toFixed(1))
        }
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;