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
    
    prompt += `EVALUATION INSTRUCTIONS:\n\n`;
    
    prompt += `1. MCQ QUESTIONS - BINARY GRADING (0 or Full Marks):\n`;
    prompt += `   - Award FULL marks ONLY if the selected option matches the correct answer exactly\n`;
    prompt += `   - Award 0 marks for ANY incorrect or missing answer\n`;
    prompt += `   - NO partial marks for MCQ questions\n\n`;
    
    prompt += `2. SHORT ANSWER QUESTIONS - KEYWORD/POINT-BASED GRADING:\n`;
    prompt += `   Identify KEY POINTS/KEYWORDS from the expected answer, then award marks proportionally:\n`;
    prompt += `   \n`;
    prompt += `   STEP 1: Extract key concepts/points from the expected answer (usually 3-5 key points)\n`;
    prompt += `   STEP 2: Check how many key points the student's answer covers\n`;
    prompt += `   STEP 3: Award marks proportionally based on coverage:\n`;
    prompt += `   \n`;
    prompt += `   Example: If question is worth 5 marks and has 5 key points:\n`;
    prompt += `   - Covers 5/5 key points correctly = 5 marks (100%)\n`;
    prompt += `   - Covers 4/5 key points correctly = 4 marks (80%)\n`;
    prompt += `   - Covers 3/5 key points correctly = 3 marks (60%)\n`;
    prompt += `   - Covers 2/5 key points correctly = 2 marks (40%)\n`;
    prompt += `   - Covers 1/5 key points correctly = 1 mark (20%)\n`;
    prompt += `   - Covers 0/5 key points or wrong answer = 0 marks\n`;
    prompt += `   \n`;
    prompt += `   Additional considerations:\n`;
    prompt += `   - Deduct 10-20% for poor clarity/grammar (if content is correct)\n`;
    prompt += `   - Award bonus 10% for exceptional clarity/examples (up to max marks)\n`;
    prompt += `   - Keywords must be used in correct context\n`;
    prompt += `   - Similar terminology is acceptable (e.g., "function" = "method")\n\n`;
    
    prompt += `3. ESSAY QUESTIONS - RUBRIC-BASED GRADING:\n`;
    prompt += `   Break down evaluation into these components:\n`;
    prompt += `   \n`;
    prompt += `   A. CONTENT & KEY POINTS (50% of marks):\n`;
    prompt += `      - Identify main points/arguments expected in the answer\n`;
    prompt += `      - Award marks proportionally based on how many key points covered\n`;
    prompt += `      - Each key point should be explained with examples/details\n`;
    prompt += `   \n`;
    prompt += `   B. DEPTH & UNDERSTANDING (25% of marks):\n`;
    prompt += `      - Shows deep understanding: 80-100% of this component\n`;
    prompt += `      - Shows moderate understanding: 50-79% of this component\n`;
    prompt += `      - Shows basic understanding: 30-49% of this component\n`;
    prompt += `      - Shows little/no understanding: 0-29% of this component\n`;
    prompt += `   \n`;
    prompt += `   C. STRUCTURE & ORGANIZATION (15% of marks):\n`;
    prompt += `      - Clear introduction, body, conclusion: Full marks\n`;
    prompt += `      - Some structure but disorganized: 50-70%\n`;
    prompt += `      - No clear structure: 0-40%\n`;
    prompt += `   \n`;
    prompt += `   D. EXAMPLES & EVIDENCE (10% of marks):\n`;
    prompt += `      - Provides relevant examples: 80-100%\n`;
    prompt += `      - Some examples but weak: 40-70%\n`;
    prompt += `      - No examples: 0-30%\n`;
    prompt += `   \n`;
    prompt += `   Calculate total: (A × 0.5) + (B × 0.25) + (C × 0.15) + (D × 0.10)\n\n`;
    
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
          prompt += `\n⚠️ GRADING: Award ${question.marks} marks if correct, 0 marks if wrong. NO PARTIAL MARKS.\n`;
          
        } else if (questionType === 'short_answer') {
          prompt += `Expected Answer/Key Points: ${question.correctAnswer || 'Evaluate based on understanding'}\n`;
          prompt += `Student Answer: ${answer.answer || 'NO ANSWER PROVIDED'}\n`;
          if (question.explanation) {
            prompt += `Additional Context: ${question.explanation}\n`;
          }
          prompt += `\n⚠️ GRADING STEPS FOR THIS QUESTION (${question.marks} marks):\n`;
          prompt += `STEP 1: Identify ${Math.min(5, question.marks)} key points/concepts from the expected answer\n`;
          prompt += `STEP 2: Check which key points are present in student's answer\n`;
          prompt += `STEP 3: Award marks proportionally (e.g., if 3 out of 5 key points covered = 3/${question.marks} marks)\n`;
          prompt += `STEP 4: Deduct 0.5-1 mark for poor clarity (if applicable)\n`;
          prompt += `STEP 5: Provide breakdown in feedback showing which points were covered/missed\n\n`;
          prompt += `EXAMPLE BREAKDOWN:\n`;
          prompt += `"Student covered 3 key points: [point 1], [point 2], [point 3]. Missing: [point 4], [point 5]. Award 3/${question.marks} marks."\n`;
          
        } else if (questionType === 'essay') {
          prompt += `Expected Coverage: ${question.maxWords || 500} words on topic\n`;
          prompt += `Key Points to Cover: ${question.correctAnswer || 'Evaluate depth of understanding'}\n`;
          prompt += `Student Answer (${answer.answer?.length || 0} characters): ${answer.answer || 'NO ANSWER PROVIDED'}\n`;
          prompt += `\n⚠️ GRADING RUBRIC FOR THIS QUESTION (${question.marks} marks):\n`;
          prompt += `\nCOMPONENT BREAKDOWN:\n`;
          prompt += `A. Content & Key Points (${Math.round(question.marks * 0.5)} marks = 50%):\n`;
          prompt += `   - Identify main points expected in answer\n`;
          prompt += `   - Award marks based on coverage of these points\n`;
          prompt += `   - List which points were covered/missed in feedback\n\n`;
          prompt += `B. Depth & Understanding (${Math.round(question.marks * 0.25)} marks = 25%):\n`;
          prompt += `   - Deep explanation with examples: 80-100% of this component\n`;
          prompt += `   - Moderate explanation: 50-79%\n`;
          prompt += `   - Superficial explanation: 30-49%\n`;
          prompt += `   - No real understanding: 0-29%\n\n`;
          prompt += `C. Structure (${Math.round(question.marks * 0.15)} marks = 15%):\n`;
          prompt += `   - Well organized with clear flow: 80-100%\n`;
          prompt += `   - Some organization: 50-70%\n`;
          prompt += `   - Poorly organized: 0-40%\n\n`;
          prompt += `D. Examples (${Math.round(question.marks * 0.10)} marks = 10%):\n`;
          prompt += `   - Strong relevant examples: 80-100%\n`;
          prompt += `   - Weak examples: 40-70%\n`;
          prompt += `   - No examples: 0-30%\n\n`;
          prompt += `CALCULATE FINAL MARK: Sum all components (round to 1 decimal if needed)\n`;
          prompt += `PROVIDE COMPONENT-WISE BREAKDOWN in feedback\n`;
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
      "marksAwarded": <marks given - can be decimal like 2.5, 3.5, etc.>,
      "maxMarks": <maximum marks for this question>,
      "feedback": "<DETAILED feedback including: 1) For short answer: list key points covered/missed, 2) For essay: breakdown by rubric components with marks for each>",
      "isCorrect": <true if got full marks, false otherwise>,
      "keyPointsCovered": <number of key points covered (for short answer/essay)>,
      "totalKeyPoints": <total key points expected (for short answer/essay)>
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
    
    prompt += `CRITICAL GRADING RULES:\n\n`;
    
    prompt += `MCQ QUESTIONS:\n`;
    prompt += `1. ONLY 0 or full marks - NO partial marks for MCQ\n`;
    prompt += `2. If student selected WRONG option → 0 marks\n`;
    prompt += `3. If student selected CORRECT option → full marks\n`;
    prompt += `4. If NO answer provided → 0 marks\n\n`;
    
    prompt += `SHORT ANSWER QUESTIONS:\n`;
    prompt += `1. MUST identify specific key points/keywords from expected answer\n`;
    prompt += `2. MUST count how many key points student covered\n`;
    prompt += `3. Award marks proportionally: (points covered / total points) × max marks\n`;
    prompt += `4. Example: Question worth 5 marks with 5 key points\n`;
    prompt += `   - Student covers 4 points → 4 marks\n`;
    prompt += `   - Student covers 3 points → 3 marks\n`;
    prompt += `   - Student covers 2 points → 2 marks\n`;
    prompt += `   - Student covers 1 point → 1 mark\n`;
    prompt += `   - Student covers 0 points or completely wrong → 0 marks\n`;
    prompt += `5. Can deduct 0.5-1 mark for very poor clarity (if points are covered)\n`;
    prompt += `6. List the specific key points covered/missed in feedback\n\n`;
    
    prompt += `ESSAY QUESTIONS:\n`;
    prompt += `1. MUST break down into components: Content (50%), Depth (25%), Structure (15%), Examples (10%)\n`;
    prompt += `2. Award marks for EACH component separately\n`;
    prompt += `3. For Content: Identify key arguments/points, award proportionally\n`;
    prompt += `4. For Depth: Judge understanding level (deep/moderate/basic/none)\n`;
    prompt += `5. For Structure: Judge organization (well/some/poor)\n`;
    prompt += `6. For Examples: Judge quality of examples (strong/weak/none)\n`;
    prompt += `7. Calculate: (Content × 0.5) + (Depth × 0.25) + (Structure × 0.15) + (Examples × 0.10)\n`;
    prompt += `8. Provide component-wise breakdown in feedback\n`;
    prompt += `9. Can award decimal marks (e.g., 7.5, 8.3) for precise grading\n\n`;
    
    prompt += `GENERAL RULES:\n`;
    prompt += `1. BE FAIR: Award marks based on what student actually wrote\n`;
    prompt += `2. BE SPECIFIC: In feedback, mention exactly which points were covered/missed\n`;
    prompt += `3. BE CONSISTENT: Apply same standards to all questions\n`;
    prompt += `4. ZERO FOR EMPTY/WRONG: If answer is empty, wrong, or off-topic → 0 marks\n`;
    prompt += `5. PARTIAL FOR INCOMPLETE: If answer shows some understanding → partial marks\n`;
    prompt += `6. FULL FOR COMPLETE: If answer covers all points correctly → full marks\n`;
    prompt += `7. Ensure totalMarks does not exceed ${assignment.maxMarks}\n`;
    prompt += `8. Calculate percentage accurately: (totalMarks / ${assignment.maxMarks}) × 100\n\n`;
    
    prompt += `FEEDBACK REQUIREMENTS:\n`;
    prompt += `1. For each question, provide DETAILED feedback explaining:\n`;
    prompt += `   - Which key points were covered (for short answer/essay)\n`;
    prompt += `   - Which key points were missed (for short answer/essay)\n`;
    prompt += `   - Why marks were awarded or deducted\n`;
    prompt += `   - Specific improvements needed\n\n`;
    
    prompt += `2. Example good feedback for short answer (5 marks, 5 key points):\n`;
    prompt += `   "Marks: 3/5. You correctly explained [point 1], [point 2], and [point 3]. However, you missed [point 4: explanation] and [point 5: explanation]. To improve, make sure to cover all key aspects of the topic."\n\n`;
    
    prompt += `3. Example good feedback for essay (10 marks):\n`;
    prompt += `   "Marks: 7.5/10. Content (4/5): Covered main arguments A, B, C well, but missed argument D. Depth (2/2.5): Good understanding shown with examples. Structure (1/1.5): Well organized with clear flow. Examples (0.5/1): Examples present but could be more specific. To improve: Add more detailed real-world examples and ensure all key points are addressed."\n\n`;
    
    prompt += `REMEMBER:\n`;
    prompt += `- MCQ: Binary grading only (0 or full marks)\n`;
    prompt += `- Short Answer: Point-based partial marking (count key points covered)\n`;
    prompt += `- Essay: Rubric-based partial marking (breakdown by components)\n`;
    prompt += `- Always show your work in feedback - explain the breakdown\n`;
    prompt += `- Decimal marks are allowed for precise grading (e.g., 3.5, 7.2, 8.8)\n`;
    
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

1. ACCURATE: Grade based on specific criteria and key points
2. FAIR: Award partial marks proportionally for short answer and essay questions
3. DETAILED: Provide specific feedback mentioning which points were covered/missed
4. CONSTRUCTIVE: Offer actionable suggestions for improvement
5. OBJECTIVE: Base grades on factual correctness and demonstrated understanding

GRADING METHODOLOGY:

MCQ QUESTIONS - Binary Grading:
- Award full marks ONLY if the answer matches the correct option exactly
- Award 0 marks for any incorrect or missing answer
- NO PARTIAL MARKS for MCQ

SHORT ANSWER QUESTIONS - Point-Based Grading:
- Identify 3-5 key points/concepts from the expected answer
- Count how many key points the student covered
- Award marks proportionally: (points covered / total points) × max marks
- Example: 5-mark question with 5 key points
  * Covers 5 points = 5 marks
  * Covers 4 points = 4 marks
  * Covers 3 points = 3 marks
  * Covers 2 points = 2 marks
  * Covers 1 point = 1 mark
  * Covers 0 points = 0 marks
- Can deduct 0.5-1 mark for very poor clarity
- MUST list specific points covered/missed in feedback

ESSAY QUESTIONS - Rubric-Based Grading:
Break down into components:
- Content & Key Points (50%): How many main arguments/points covered
- Depth & Understanding (25%): Level of explanation and analysis
- Structure & Organization (15%): Logical flow and coherence
- Examples & Evidence (10%): Quality and relevance of examples

Calculate: (Content × 0.5) + (Depth × 0.25) + (Structure × 0.15) + (Examples × 0.10)

MUST provide component-wise breakdown in feedback showing marks for each component.

FEEDBACK REQUIREMENTS:
- For short answer: List which key points were covered and which were missed
- For essay: Provide breakdown by rubric components with marks for each
- Be specific about what was done well and what needs improvement
- Decimal marks are allowed (e.g., 3.5, 7.2, 8.8) for precise grading

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
