const Resume = require('../models/Resume');

// Test data and utility functions for development and testing

const sampleAnalysis = {
  toneScore: 8,
  formattingScore: 7,
  clarityScore: 9,
  overallScore: 8,
  strengths: [
    "Strong use of action verbs and quantified achievements",
    "Clear and concise job descriptions",
    "Professional formatting and layout"
  ],
  weaknesses: [
    "Some sections could be more detailed",
    "Missing keywords for ATS optimization",
    "Could benefit from a stronger summary statement"
  ],
  suggestions: [
    "Add more specific metrics and numbers to achievements",
    "Include relevant industry keywords throughout",
    "Consider adding a professional summary at the top",
    "Use consistent bullet point formatting",
    "Proofread for any remaining grammatical errors"
  ],
  detailedFeedback: "This resume demonstrates strong professional experience with clear, quantified achievements. The formatting is clean and easy to read, which will help with both human reviewers and ATS systems. To improve further, consider adding more specific metrics to your accomplishments and ensuring all sections are equally detailed. The tone is appropriately professional throughout, and the clarity of your descriptions makes it easy for employers to understand your value proposition."
};

const createSampleResume = async () => {
  try {
    const sampleResume = new Resume({
      fileName: 'sample_resume.pdf',
      originalText: `
JOHN DOE
Software Engineer

CONTACT INFORMATION
Email: john.doe@email.com
Phone: (555) 123-4567
LinkedIn: linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years of experience in full-stack development.

EXPERIENCE
Senior Software Engineer | Tech Company | 2020-Present
• Developed and maintained web applications using React and Node.js
• Improved application performance by 30%
• Led a team of 3 junior developers

Software Engineer | Another Company | 2018-2020
• Built REST APIs using Python and Django
• Collaborated with cross-functional teams
• Participated in code reviews and testing

EDUCATION
Bachelor of Science in Computer Science
University Name | 2014-2018

SKILLS
• JavaScript, Python, React, Node.js
• MongoDB, PostgreSQL
• AWS, Docker, Git
      `,
      analysis: sampleAnalysis,
      uploadedAt: new Date(),
      analyzedAt: new Date()
    });

    await sampleResume.save();
    console.log('Sample resume created successfully');
    return sampleResume;
  } catch (error) {
    console.error('Error creating sample resume:', error);
  }
};

const getRandomScore = (min = 4, max = 10) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateRandomAnalysis = () => {
  const toneScore = getRandomScore(5, 10);
  const formattingScore = getRandomScore(4, 9);
  const clarityScore = getRandomScore(6, 10);
  const overallScore = Math.round((toneScore + formattingScore + clarityScore) / 3);

  return {
    toneScore,
    formattingScore,
    clarityScore,
    overallScore,
    strengths: [
      "Professional language and tone",
      "Clear job progression",
      "Relevant experience highlighted"
    ],
    weaknesses: [
      "Could use more quantified achievements",
      "Some formatting inconsistencies",
      "Missing key technical skills"
    ],
    suggestions: [
      "Add specific metrics to achievements",
      "Improve section formatting consistency",
      "Include more relevant keywords",
      "Strengthen the professional summary"
    ],
    detailedFeedback: `This resume shows ${overallScore >= 7 ? 'strong' : 'good'} potential with a professional tone scoring ${toneScore}/10. The formatting could be improved (${formattingScore}/10) and the clarity is ${clarityScore >= 8 ? 'excellent' : 'good'} at ${clarityScore}/10. Focus on the suggested improvements to enhance overall effectiveness.`
  };
};

module.exports = {
  sampleAnalysis,
  createSampleResume,
  generateRandomAnalysis,
  getRandomScore
};