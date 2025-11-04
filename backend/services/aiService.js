const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

class AIService {
  constructor() {
    // Initialize Gemini
    const geminiApiKey = process.env.GEMINI_API_KEY || 'AIzaSyBLd1IdvsRJVJQJvrZrU7to-V--Hu5In_Q';
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // Initialize OpenAI
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Set default AI provider (can be 'openai' or 'gemini')
    this.defaultProvider = process.env.AI_PROVIDER || 'openai';
  }

  async generateQuestions(content, assignmentType, numberOfQuestions, assignmentLevel, subject, provider = this.defaultProvider) {
    try {
      const prompt = this.buildPrompt(content, assignmentType, numberOfQuestions, assignmentLevel, subject);
      
      if (provider === 'openai') {
        return await this.generateQuestionsWithOpenAI(prompt, assignmentType);
      } else {
        return await this.generateQuestionsWithGemini(prompt, assignmentType);
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error('Failed to generate questions using AI');
    }
  }

  async generateQuestionsWithOpenAI(prompt, assignmentType) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert educator who creates high-quality educational questions. Always respond with valid JSON only, without any markdown formatting or additional text."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const text = completion.choices[0].message.content;
      return this.parseResponse(text, assignmentType);
    } catch (error) {
      console.error('Error generating questions with OpenAI:', error);
      throw new Error('Failed to generate questions using OpenAI');
    }
  }

  async generateQuestionsWithGemini(prompt, assignmentType) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseResponse(text, assignmentType);
    } catch (error) {
      console.error('Error generating questions with Gemini:', error);
      throw new Error('Failed to generate questions using Gemini');
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

  async generateFromModuleName(moduleName, assignmentType, numberOfQuestions, assignmentLevel, subject, provider = this.defaultProvider) {
    const content = `Module: ${moduleName}
    
Please generate questions based on typical learning objectives and content that would be covered in a module titled "${moduleName}" for the subject "${subject}".

Consider standard curriculum topics, key concepts, and learning outcomes typically associated with this module name.`;

    return this.generateQuestions(content, assignmentType, numberOfQuestions, assignmentLevel, subject, provider);
  }

  // Simple test method to demonstrate OpenAI integration
  async generateHaiku() {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: "write a haiku about ai"
          }
        ],
        temperature: 0.7,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error generating haiku:', error);
      throw new Error('Failed to generate haiku using OpenAI');
    }
  }
}

module.exports = new AIService();
