const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    console.log('Listing available models...');
    
    const genAI = new GoogleGenerativeAI('AIzaSyBLd1IdvsRJVJQJvrZrU7to-V--Hu5In_Q');
    
    // Use the listModels method to see what's available
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBLd1IdvsRJVJQJvrZrU7to-V--Hu5In_Q');
    const data = await response.json();
    
    console.log('Available models:');
    if (data.models) {
      data.models.forEach(model => {
        console.log(`- ${model.name} (${model.displayName})`);
        if (model.supportedGenerationMethods) {
          console.log(`  Methods: ${model.supportedGenerationMethods.join(', ')}`);
        }
      });
    } else {
      console.log('No models found or error:', data);
    }
    
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
