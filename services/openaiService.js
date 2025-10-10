const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async analyzeResume(resumeText) {
    try {
      const prompt = this.createAnalysisPrompt(resumeText);
      
      const completion = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: parseInt(process.env.MAX_TOKENS) || 2000,
        temperature: 0.3,
      });

      const response = completion.choices[0].message.content;
      return this.parseAnalysisResponse(response);
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to analyze resume with AI');
    }
  }

  createAnalysisPrompt(resumeText) {
    return `
Please analyze the following resume and provide a comprehensive evaluation. Rate each category from 1-10 and provide specific feedback.

RESUME TEXT:
${resumeText}

Please provide your analysis in the following JSON format:
{
  "toneScore": [1-10 score for professional tone],
  "formattingScore": [1-10 score for formatting and structure],
  "clarityScore": [1-10 score for clarity and readability],
  "overallScore": [1-10 overall score],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "detailedFeedback": "Detailed paragraph explaining the analysis, highlighting key areas for improvement and what's working well"
}

EVALUATION CRITERIA:

TONE (1-10):
- Professional language usage
- Appropriate level of confidence
- Industry-appropriate terminology
- Avoidance of casual or inappropriate language

FORMATTING (1-10):
- Clear section organization
- Consistent formatting
- Proper use of bullet points
- Logical flow and structure
- Contact information placement

CLARITY (1-10):
- Clear and concise descriptions
- Quantified achievements where possible
- Easy to scan and read
- Relevant information for the role
- Grammar and spelling accuracy

Provide specific, actionable suggestions for improvement. Focus on what would make this resume more effective for job applications.
`;
  }

  parseAnalysisResponse(response) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // If no JSON found, throw error
      throw new Error('No valid JSON found in response');
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      // Return a fallback analysis
      return {
        toneScore: 5,
        formattingScore: 5,
        clarityScore: 5,
        overallScore: 5,
        strengths: ['Resume submitted for analysis'],
        weaknesses: ['Analysis could not be completed'],
        suggestions: ['Please try uploading again'],
        detailedFeedback: 'Unable to complete analysis. Please ensure the resume content is clear and try again.'
      };
    }
  }
}

module.exports = new OpenAIService();