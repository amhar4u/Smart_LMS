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
        prompt += `Please provide ${numberOfQuestions} multiple choice questions with 4 options each. Mark the correct answer clearly. 
IMPORTANT: Ensure one and only one option is marked as correct.

Format your response as JSON with the following structure:
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
              "correctAnswer": "Option B text",
              "explanation": "Brief explanation why Option B is correct",
              "marks": 5
            }
          ]
        }
        
Note: The correctAnswer field should contain the text of the correct option for reference.`;
        break;
      
      case 'short_answer':
        prompt += `Please provide ${numberOfQuestions} short answer questions that require 1-3 sentence responses. 
IMPORTANT: For each question, provide a COMPLETE and ACCURATE correct answer that would receive full marks.

Format your response as JSON with the following structure:
        {
          "questions": [
            {
              "question": "Question text here?",
              "correctAnswer": "The complete and accurate correct answer that demonstrates full understanding of the concept",
              "maxLength": 200,
              "marks": 5
            }
          ]
        }
        
Note: The correctAnswer should be a model answer that covers all key points and demonstrates complete understanding.`;
        break;
      
      case 'essay':
        prompt += `Please provide ${numberOfQuestions} essay questions that require detailed responses.
IMPORTANT: For each question, provide DETAILED GUIDELINES and KEY POINTS that should be covered in a complete answer.

Format your response as JSON with the following structure:
        {
          "questions": [
            {
              "question": "Question text here?",
              "correctAnswer": "Detailed key points and guidelines that should be covered: 1) First key point... 2) Second key point... 3) Third key point...",
              "minLength": 500,
              "maxLength": 1000,
              "marks": 10
            }
          ]
        }
        
Note: The correctAnswer should contain the key concepts, main points, and guidelines that a complete answer should address.`;
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
        return parsed.questions.map(q => {
          // Normalize the question object
          const normalized = {
            ...q,
            type: assignmentType
          };

          // Handle backward compatibility: map expectedAnswer to correctAnswer
          if (q.expectedAnswer && !q.correctAnswer) {
            normalized.correctAnswer = q.expectedAnswer;
            delete normalized.expectedAnswer;
          }

          // Handle backward compatibility: map guidelines to correctAnswer
          if (q.guidelines && !q.correctAnswer) {
            normalized.correctAnswer = q.guidelines;
            delete normalized.guidelines;
          }

          // Ensure marks are set (default based on type)
          if (!normalized.marks) {
            switch (assignmentType) {
              case 'MCQ':
                normalized.marks = 2;
                break;
              case 'short_answer':
                normalized.marks = 5;
                break;
              case 'essay':
                normalized.marks = 10;
                break;
              default:
                normalized.marks = 1;
            }
          }

          return normalized;
        });
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

  // Evaluate assignment submission using AI
  async evaluateAssignment(assignment, studentAnswers, provider = this.defaultProvider) {
    try {
      const prompt = this.buildEvaluationPrompt(assignment, studentAnswers);
      
      if (provider === 'openai') {
        return await this.evaluateWithOpenAI(prompt, assignment.maxMarks);
      } else {
        return await this.evaluateWithGemini(prompt, assignment.maxMarks);
      }
    } catch (error) {
      console.error('Error evaluating assignment:', error);
      throw new Error('Failed to evaluate assignment using AI');
    }
  }

  buildEvaluationPrompt(assignment, studentAnswers) {
    let prompt = `You are an expert educator evaluating a student's assignment. Please evaluate the following answers objectively and provide detailed feedback.\n\n`;
    
    prompt += `Assignment: ${assignment.title}\n`;
    prompt += `Subject: ${assignment.subject.name}\n`;
    prompt += `Maximum Marks: ${assignment.maxMarks}\n`;
    prompt += `Assignment Type: ${assignment.assignmentType}\n`;
    prompt += `Total Questions: ${assignment.questions.length}\n\n`;
    
    prompt += `EVALUATION INSTRUCTIONS:\n`;
    prompt += `1. For MCQ questions: Award full marks ONLY if the selected option matches the correct answer exactly. Award 0 marks for incorrect answers.\n`;
    prompt += `2. For short answer questions: Compare student answer with the expected answer. Award marks based on:\n`;
    prompt += `   - Correctness of key concepts (50%)\n`;
    prompt += `   - Completeness of answer (30%)\n`;
    prompt += `   - Clarity and coherence (20%)\n`;
    prompt += `3. For essay questions: Evaluate based on:\n`;
    prompt += `   - Understanding of topic (40%)\n`;
    prompt += `   - Quality of arguments/examples (30%)\n`;
    prompt += `   - Structure and organization (15%)\n`;
    prompt += `   - Language and clarity (15%)\n\n`;
    
    prompt += `Questions and Student Answers:\n\n`;
    
    studentAnswers.forEach((answer, index) => {
      // First try to get question from studentAnswer's stored question details
      let question = answer.questionDetails || assignment.questions.find(q => q._id.toString() === answer.questionId);
      
      if (question) {
        prompt += `Question ${index + 1}:\n`;
        prompt += `Text: ${answer.questionText || question.question}\n`;
        prompt += `Type: ${answer.type || question.type}\n`;
        prompt += `Marks: ${question.marks}\n`;
        
        const questionType = answer.type || question.type;
        
        if (questionType === 'MCQ') {
          const correctOption = question.options?.find(o => o.isCorrect);
          prompt += `Options:\n`;
          if (question.options) {
            question.options.forEach((opt, idx) => {
              prompt += `  ${String.fromCharCode(65 + idx)}) ${opt.option}${opt.isCorrect ? ' [CORRECT]' : ''}\n`;
            });
          }
          prompt += `Student Selected: ${answer.selectedOption || answer.answer || 'NO ANSWER PROVIDED'}\n`;
          prompt += `Correct Answer: ${correctOption?.option || 'Not specified'}\n`;
          prompt += `INSTRUCTION: If student answer does NOT match the correct answer EXACTLY, award 0 marks. Otherwise, award full marks (${question.marks}).\n`;
        } else if (questionType === 'short_answer') {
          prompt += `Expected Answer/Key Points: ${question.correctAnswer || 'Evaluate based on understanding'}\n`;
          prompt += `Student Answer: ${answer.answer || 'NO ANSWER PROVIDED'}\n`;
          if (question.explanation) {
            prompt += `Additional Context: ${question.explanation}\n`;
          }
          prompt += `INSTRUCTION: Compare the student's answer with the expected answer. If the answer is completely wrong or empty, award 0 marks. Award partial marks based on correctness and completeness.\n`;
        } else if (questionType === 'essay') {
          prompt += `Expected Coverage: ${question.maxWords || 500} words on topic\n`;
          prompt += `Key Points to Cover: ${question.correctAnswer || 'Evaluate depth of understanding'}\n`;
          prompt += `Student Answer (${answer.answer?.length || 0} characters): ${answer.answer || 'NO ANSWER PROVIDED'}\n`;
          prompt += `INSTRUCTION: If no answer is provided or answer is completely off-topic, award 0 marks. Otherwise evaluate based on depth, examples, and understanding.\n`;
        }
        
        prompt += `\n`;
      } else {
        prompt += `Question ${index + 1}: [Question data not available]\n`;
        prompt += `Student Answer: ${answer.answer || answer.selectedOption || 'NO ANSWER PROVIDED'}\n\n`;
      }
    });
    
    prompt += `\nPlease evaluate and provide your response in the following JSON format ONLY (no markdown, no extra text):\n`;
    prompt += `{
  "totalMarks": <total marks obtained out of ${assignment.maxMarks}>,
  "percentage": <percentage score>,
  "level": "<beginner|intermediate|advanced>",
  "feedback": "<detailed feedback on overall performance, highlighting strengths and weaknesses>",
  "questionEvaluations": [
    {
      "questionIndex": <question number starting from 1>,
      "marksAwarded": <marks given for this question>,
      "feedback": "<specific feedback explaining why marks were awarded or deducted>",
      "isCorrect": <true|false>
    }
  ],
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "areasForImprovement": ["<specific area 1>", "<specific area 2>", "<specific area 3>"],
  "recommendations": "<actionable suggestions for improvement with specific examples>"
}\n\n`;
    
    prompt += `Level Criteria (MUST FOLLOW EXACTLY):\n`;
    prompt += `- 0-40%: Set level as "beginner"\n`;
    prompt += `- 41-70%: Set level as "intermediate"\n`;
    prompt += `- 71-100%: Set level as "advanced"\n\n`;
    
    prompt += `CRITICAL GRADING RULES:\n`;
    prompt += `1. For MCQ: If the student selected the WRONG option, award 0 marks for that question. No partial credit.\n`;
    prompt += `2. For MCQ: If the student selected the CORRECT option, award full marks for that question.\n`;
    prompt += `3. For MCQ: If NO answer is provided, award 0 marks.\n`;
    prompt += `4. For short answer/essay: If answer is completely wrong, off-topic, or empty, award 0 marks.\n`;
    prompt += `5. For short answer/essay: If answer shows some understanding but is incomplete, award partial marks (30-70% of total).\n`;
    prompt += `6. For short answer/essay: If answer is accurate and complete, award 80-100% of marks.\n`;
    prompt += `7. BE STRICT: Wrong answers should receive 0 or very low marks. Don't be generous with incorrect responses.\n\n`;
    
    prompt += `IMPORTANT:\n`;
    prompt += `- Be strict but fair in grading\n`;
    prompt += `- WRONG ANSWERS MUST GET 0 OR VERY LOW MARKS\n`;
    prompt += `- Provide specific examples in feedback\n`;
    prompt += `- Explain reasoning for marks awarded\n`;
    prompt += `- Give constructive suggestions for improvement\n`;
    prompt += `- Ensure totalMarks does not exceed ${assignment.maxMarks}\n`;
    prompt += `- Calculate percentage accurately: (totalMarks / ${assignment.maxMarks}) * 100\n`;
    
    return prompt;
  }

  async evaluateWithOpenAI(prompt, maxMarks) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert educator and examiner with years of experience in evaluating student work. Your evaluations should be:
1. ACCURATE: Grade strictly based on correctness and understanding demonstrated
2. FAIR: Apply consistent standards across all students
3. STRICT: Wrong answers should receive 0 marks or very low marks. Do not be generous with incorrect responses.
4. DETAILED: Provide specific feedback on what was done well and what needs improvement
5. CONSTRUCTIVE: Offer actionable suggestions for improvement
6. OBJECTIVE: Base grades on factual correctness and conceptual understanding

CRITICAL GRADING RULES:
- For MCQ questions: Award full marks ONLY if the answer is 100% correct and matches the correct option exactly, 0 marks otherwise. NO PARTIAL CREDIT.
- For MCQ questions: If student selects wrong option, award 0 marks. Be strict.
- For short answer questions: Award marks based on accuracy (50%), completeness (30%), and clarity (20%). Partial marks allowed ONLY if answer shows understanding.
- For short answer questions: If answer is completely wrong or empty, award 0 marks.
- For essay questions: Evaluate based on understanding (40%), structure (30%), examples (20%), and depth (10%). Partial marks allowed.
- For essay questions: If answer is off-topic, empty, or shows no understanding, award 0 marks.

BE STRICT: Students who answer incorrectly should receive low scores (0-30%). Only well-answered questions should get 70%+ marks.

Always respond with valid JSON only, without any markdown formatting or additional text.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1, // Very low temperature for consistent and strict evaluation
        max_tokens: 3000,
        top_p: 0.9,
        frequency_penalty: 0,
        presence_penalty: 0
      });

      const text = completion.choices[0].message.content;
      return this.parseEvaluationResponse(text, maxMarks);
    } catch (error) {
      console.error('Error evaluating with OpenAI:', error);
      throw new Error('Failed to evaluate using OpenAI');
    }
  }

  async evaluateWithGemini(prompt, maxMarks) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseEvaluationResponse(text, maxMarks);
    } catch (error) {
      console.error('Error evaluating with Gemini:', error);
      throw new Error('Failed to evaluate using Gemini');
    }
  }

  parseEvaluationResponse(text, maxMarks) {
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
      
      // Validate and normalize the response
      const evaluation = {
        marks: Math.min(parsed.totalMarks || 0, maxMarks),
        percentage: parsed.percentage || ((parsed.totalMarks / maxMarks) * 100),
        level: this.determineLevel(parsed.percentage || ((parsed.totalMarks / maxMarks) * 100)),
        feedback: parsed.feedback || 'No feedback provided',
        questionEvaluations: parsed.questionEvaluations || [],
        strengths: parsed.strengths || [],
        areasForImprovement: parsed.areasForImprovement || [],
        recommendations: parsed.recommendations || 'Keep practicing and reviewing the material.'
      };
      
      // Ensure level matches criteria
      if (parsed.level && ['beginner', 'intermediate', 'advanced'].includes(parsed.level.toLowerCase())) {
        evaluation.level = parsed.level.toLowerCase();
      }
      
      return evaluation;
    } catch (error) {
      console.error('Error parsing AI evaluation response:', error);
      console.error('Raw response:', text);
      throw new Error('Failed to parse AI evaluation response');
    }
  }

  determineLevel(percentage) {
    if (percentage <= 40) {
      return 'beginner';
    } else if (percentage > 40 && percentage <= 70) {
      return 'intermediate';
    } else {
      return 'advanced';
    }
  }
}

module.exports = new AIService();
