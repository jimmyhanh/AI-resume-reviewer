const pdfParse = require('pdf-parse');

class TextExtractionService {
  async extractText(buffer, mimetype, filename) {
    try {
      switch (mimetype) {
        case 'application/pdf':
          return await this.extractFromPDF(buffer);
        case 'text/plain':
          return buffer.toString('utf-8');
        default:
          throw new Error(`Unsupported file type: ${mimetype}`);
      }
    } catch (error) {
      console.error('Text extraction error:', error);
      throw new Error(`Failed to extract text from ${filename}`);
    }
  }

  async extractFromPDF(buffer) {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  validateExtractedText(text) {
    if (!text || text.trim().length === 0) {
      throw new Error('No text content found in the uploaded file');
    }

    if (text.length < 50) {
      throw new Error('Resume content appears to be too short for meaningful analysis');
    }

    if (text.length > 50000) {
      throw new Error('Resume content is too long for analysis');
    }

    return true;
  }

  cleanText(text) {
    // Remove excessive whitespace and normalize line breaks
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }
}

module.exports = new TextExtractionService();