const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    this.genAI = new GoogleGenerativeAI('AIzaSyBLd1IdvsRJVJQJvrZrU7to-V--Hu5In_Q');
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async generateQuestions(content, assignmentType, numberOfQuestions, assignmentLevel, subject) {
    try {
      const prompt = this.buildPrompt(content, assignmentType, numberOfQuestions, assignmentLevel, subject);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseResponse(text, assignmentType);
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate questions using AI');
    }
  }

  buildPrompt(content, assignmentType, numberOfQuestions, assignmentLevel, subject) {
    let prompt = `Generate ${numberOfQuestions} ${assignmentLevel} level ${assignmentType} questions based on the following content for the subject "${subject}":\n\n${content}\n\n`;

    switch (assignmentType) {
      case 'MCQ':
        prompt += `Please provide ${numberOfQuestions} multiple choice questions with 4 options each. Mark the correct answer clearly. Format your response as JSON with the following structure:
        {
          "questions": [
            {
              "question": "Question text here?",
              "options": [
                {"option": "Option A text", "isCorrect": false},
                {"option": "Option B text", "isCorrect": true},
                {"option": "Option C text", "isCorrect": false},
                {"option": "Option D text", "isCorrect": false}
              ],
              "explanation": "Brief explanation why this is correct"
            }
          ]
        }`;
        break;
      
      case 'short_answer':
        prompt += `Please provide ${numberOfQuestions} short answer questions that require 1-3 sentence responses. Format your response as JSON with the following structure:
        {
          "questions": [
            {
              "question": "Question text here?",
              "expectedAnswer": "Sample answer or key points",
              "maxLength": 200
            }
          ]
        }`;
        break;
      
      case 'essay':
        prompt += `Please provide ${numberOfQuestions} essay questions that require detailed responses. Format your response as JSON with the following structure:
        {
          "questions": [
            {
              "question": "Question text here?",
              "guidelines": "What should be covered in the answer",
              "minLength": 500,
              "maxLength": 1000
            }
          ]
        }`;
        break;
      
      default:
        throw new Error(`Unsupported assignment type: ${assignmentType}`);
    }

    prompt += '\n\nPlease ensure all questions are relevant to the content provided and appropriate for the specified difficulty level.';
    
    return prompt;
  }

  parseResponse(text, assignmentType) {
    try {
      // Clean the response text to extract JSON
      let cleanText = text.trim();
      
      // Remove any markdown formatting
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Find the JSON part
      const jsonStart = cleanText.indexOf('{');
      const jsonEnd = cleanText.lastIndexOf('}') + 1;
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanText = cleanText.substring(jsonStart, jsonEnd);
      }
      
      const parsed = JSON.parse(cleanText);
      
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return parsed.questions.map(q => ({
          ...q,
          type: assignmentType
        }));
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('Raw response:', text);
      throw new Error('Failed to parse AI generated questions');
    }
  }

  async generateFromModuleName(moduleName, assignmentType, numberOfQuestions, assignmentLevel, subject) {
    const content = `Module: ${moduleName}
    
Please generate questions based on typical learning objectives and content that would be covered in a module titled "${moduleName}" for the subject "${subject}".

Consider standard curriculum topics, key concepts, and learning outcomes typically associated with this module name.`;

    return this.generateQuestions(content, assignmentType, numberOfQuestions, assignmentLevel, subject);
  }
}

module.exports = new AIService();
