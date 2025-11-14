const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const OUTPUT_DIR = path.join(__dirname, 'public', 'assets', 'models');

const models = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

// Create directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('📥 Downloading Face-API.js models...\n');

let completed = 0;

models.forEach((model) => {
  const url = `${MODEL_BASE_URL}/${model}`;
  const outputPath = path.join(OUTPUT_DIR, model);

  https.get(url, (response) => {
    const fileStream = fs.createWriteStream(outputPath);
    
    response.pipe(fileStream);

    fileStream.on('finish', () => {
      fileStream.close();
      completed++;
      console.log(`✅ Downloaded: ${model}`);
      
      if (completed === models.length) {
        console.log('\n🎉 All models downloaded successfully!');
        console.log(`📁 Location: ${OUTPUT_DIR}`);
      }
    });
  }).on('error', (error) => {
    console.error(`❌ Error downloading ${model}:`, error.message);
  });
});
