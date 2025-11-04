# OpenAI Integration Guide

## Overview
The Smart LMS system now supports OpenAI integration alongside the existing Google Gemini AI service. This provides flexibility to use either AI provider for generating educational content and questions.

## What Was Implemented

### 1. OpenAI Package Installation
- Installed the official `openai` npm package (v4.x)
- Package added to backend dependencies

### 2. Configuration
- Added `OPENAI_API_KEY` to `.env` file
- Added `AI_PROVIDER` environment variable (defaults to 'openai')
- Supports switching between 'openai' and 'gemini' providers

### 3. AIService Updates (`backend/services/aiService.js`)

#### New Features:
- **Dual AI Provider Support**: Can use either OpenAI or Gemini
- **OpenAI Chat Completions**: Uses `gpt-4o-mini` model
- **Haiku Generator**: Simple test method demonstrating OpenAI integration
- **Flexible Provider Selection**: Choose provider per request or use default

#### New Methods:
```javascript
// Generate questions with OpenAI
generateQuestionsWithOpenAI(prompt, assignmentType)

// Generate questions with Gemini (existing, refactored)
generateQuestionsWithGemini(prompt, assignmentType)

// Generate a haiku (test method)
generateHaiku()
```

#### Updated Methods:
```javascript
// Now accepts optional provider parameter
generateQuestions(content, assignmentType, numberOfQuestions, assignmentLevel, subject, provider)

// Now accepts optional provider parameter
generateFromModuleName(moduleName, assignmentType, numberOfQuestions, assignmentLevel, subject, provider)
```

## Usage

### Basic Usage (Default Provider)
```javascript
const aiService = require('./services/aiService');

// Uses default provider (OpenAI if AI_PROVIDER=openai in .env)
const questions = await aiService.generateQuestions(
  'Content here',
  'MCQ',
  5,
  'intermediate',
  'Computer Science'
);
```

### Explicit Provider Selection
```javascript
// Force use of OpenAI
const openaiQuestions = await aiService.generateQuestions(
  'Content here',
  'MCQ',
  5,
  'intermediate',
  'Computer Science',
  'openai'
);

// Force use of Gemini
const geminiQuestions = await aiService.generateQuestions(
  'Content here',
  'MCQ',
  5,
  'intermediate',
  'Computer Science',
  'gemini'
);
```

### Test Haiku Generation
```javascript
const haiku = await aiService.generateHaiku();
console.log(haiku);
```

## Environment Variables

### Required for OpenAI
```env
OPENAI_API_KEY=your-openai-api-key-here
```

### Optional Configuration
```env
# Set default AI provider (openai or gemini)
AI_PROVIDER=openai
```

## Testing

A test script has been created at `backend/testOpenAI.js` to verify the integration.

### Run Tests
```bash
cd backend
node testOpenAI.js
```

### Test Results
✅ Successfully generates haikus using OpenAI
✅ Successfully generates educational questions using OpenAI
✅ Proper JSON parsing and formatting
✅ Error handling implemented

## API Differences

### OpenAI (gpt-4o-mini)
- Uses Chat Completions API
- System and user message roles
- Better at following JSON formatting instructions
- Temperature: 0.7 (configurable)
- Max tokens: 2000 (configurable)

### Gemini (gemini-2.5-flash)
- Uses Generate Content API
- Single prompt string
- Fast response times
- Existing implementation maintained

## Benefits of Dual Provider Support

1. **Redundancy**: Fallback to Gemini if OpenAI is down
2. **Cost Optimization**: Choose provider based on pricing
3. **Quality Comparison**: Test which AI produces better questions
4. **Flexibility**: Switch providers without code changes
5. **Future-Proof**: Easy to add more AI providers

## Models Used

- **OpenAI**: `gpt-4o-mini` (efficient, cost-effective)
- **Gemini**: `gemini-2.5-flash` (fast response times)

## Security Notes

⚠️ **Important**: The API key is stored in `.env` file
- Never commit `.env` to version control
- Keep API keys secure
- Rotate keys regularly
- Monitor API usage

## Sample Code Reference

The implementation correctly uses OpenAI's Chat Completions API instead of the incorrect `responses.create()` method shown in your sample. The correct pattern is:

```javascript
const completion = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: "System instructions" },
    { role: "user", content: "User prompt" }
  ],
  temperature: 0.7,
});

const result = completion.choices[0].message.content;
```

## Next Steps

To use OpenAI in your application:

1. **Set Default Provider**: Update `.env` to set `AI_PROVIDER=openai`
2. **Update Routes**: Existing routes automatically use the new system
3. **Monitor Usage**: Track API costs and response times
4. **Add Fallbacks**: Implement automatic fallback to Gemini if OpenAI fails

## Files Modified

- ✅ `backend/.env` - Added OPENAI_API_KEY
- ✅ `backend/package.json` - Added openai dependency
- ✅ `backend/services/aiService.js` - Implemented dual provider support
- ✅ `backend/testOpenAI.js` - Created test script

## Conclusion

The OpenAI integration is now fully functional and tested. The system maintains backward compatibility with Gemini while providing the flexibility to use OpenAI's powerful language models.
