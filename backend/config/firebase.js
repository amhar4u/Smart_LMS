const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK using environment variables
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
}

const bucket = admin.storage().bucket();

/**
 * Upload file to Firebase Storage using Admin SDK
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name with extension
 * @param {string} folder - Folder path (e.g., 'modules/documents' or 'modules/videos')
 * @returns {Promise<string>} - Download URL
 */
const uploadFile = async (fileBuffer, fileName, folder) => {
  try {
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;
    const filePath = `${folder}/${uniqueFileName}`;
    
    console.log(`📤 [FIREBASE] Uploading file: ${filePath}`);
    console.log(`📁 [FIREBASE] File size: ${fileBuffer.length} bytes`);
    
    const file = bucket.file(filePath);
    
    // Upload the file
    await file.save(fileBuffer, {
      metadata: {
        contentType: getContentType(fileName),
        metadata: {
          originalName: fileName,
          uploadedAt: new Date().toISOString()
        }
      }
    });
    
    // Make the file publicly readable
    await file.makePublic();
    
    // Get the public URL
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    
    console.log(`✅ [FIREBASE] File uploaded successfully: ${filePath}`);
    console.log(`🔗 [FIREBASE] Download URL: ${downloadURL}`);
    
    return {
      downloadURL,
      filePath,
      uniqueFileName
    };
  } catch (error) {
    console.error('❌ [FIREBASE] Error uploading file:', error);
    console.error('❌ [FIREBASE] Error details:', {
      code: error.code,
      message: error.message,
      name: error.name
    });
    
    throw new Error(`Failed to upload file to Firebase Storage: ${error.message}`);
  }
};

/**
 * Delete file from Firebase Storage using Admin SDK
 * @param {string} filePath - File path in Firebase Storage
 * @returns {Promise<void>}
 */
const deleteFile = async (filePath) => {
  try {
    console.log(`🗑️ [FIREBASE] Deleting file: ${filePath}`);
    const file = bucket.file(filePath);
    await file.delete();
    console.log(`✅ [FIREBASE] File deleted successfully: ${filePath}`);
  } catch (error) {
    console.error('❌ [FIREBASE] Error deleting file:', error);
    console.error('❌ [FIREBASE] Error details:', {
      code: error.code,
      message: error.message,
      name: error.name
    });
    
    if (error.code === 404) {
      console.warn(`⚠️ [FIREBASE] File not found (already deleted?): ${filePath}`);
      return; // Don't throw error for already deleted files
    }
    
    throw new Error(`Failed to delete file from Firebase Storage: ${error.message}`);
  }
};

/**
 * Get content type based on file extension
 * @param {string} fileName - File name with extension
 * @returns {string} - Content type
 */
function getContentType(fileName) {
  const ext = fileName.toLowerCase().split('.').pop();
  const contentTypes = {
    'pdf': 'application/pdf',
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'flv': 'video/x-flv',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',
    '3gp': 'video/3gpp',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain'
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

module.exports = {
  bucket,
  uploadFile,
  deleteFile
};
