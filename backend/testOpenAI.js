require('dotenv').config();
const aiService = require('./services/aiService');

async function testOpenAI() {
  console.log('Testing OpenAI Integration...\n');
  
  try {
    // Test 1: Generate a haiku
    console.log('Test 1: Generating a haiku about AI...');
    const haiku = await aiService.generateHaiku();
    console.log('Result:');
    console.log(haiku);
    console.log('\n✅ Haiku generation successful!\n');
    
    // Test 2: Generate educational questions using OpenAI
    console.log('Test 2: Generating MCQ questions about JavaScript...');
    const questions = await aiService.generateQuestions(
      'JavaScript is a programming language that allows you to implement complex features on web pages. It is used for creating interactive effects within web browsers.',
      'MCQ',
      2,
      'beginner',
      'Computer Science',
      'openai'  // Explicitly use OpenAI
    );
    
    console.log('Generated Questions:');
    console.log(JSON.stringify(questions, null, 2));
    console.log('\n✅ Question generation successful!\n');
    
    console.log('🎉 All tests passed! OpenAI integration is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

testOpenAI();
