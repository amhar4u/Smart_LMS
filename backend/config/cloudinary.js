const cloudinary = require('cloudinary').v2;
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'doisntm9x',
  api_key: '158699552847641',
  api_secret: 'CpCXCzD95kEM1ZFuWNyRe-p9dm0',
  secure: true
});

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name with extension
 * @param {string} folder - Folder path (e.g., 'modules/documents' or 'modules/videos')
 * @returns {Promise<Object>} - Upload result with URL and public_id
 */
const uploadFile = async (fileBuffer, fileName, folder) => {
  try {
    const timestamp = Date.now();
    const fileNameWithoutExt = path.parse(fileName).name;
    const fileExt = path.extname(fileName).toLowerCase();
    const uniqueFileName = `${timestamp}-${fileNameWithoutExt}`;
    
    console.log(`📤 [CLOUDINARY] Uploading file: ${folder}/${uniqueFileName}`);
    console.log(`📁 [CLOUDINARY] File size: ${fileBuffer.length} bytes`);
    
    // Determine resource type based on file extension
    let resourceType = 'auto';
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.3gp'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    if (videoExtensions.includes(fileExt)) {
      resourceType = 'video';
    } else if (imageExtensions.includes(fileExt)) {
      resourceType = 'image';
    } else {
      resourceType = 'raw'; // For PDFs and other documents
    }
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: uniqueFileName,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: false,
          overwrite: false,
          // For videos, include video metadata
          ...(resourceType === 'video' && {
            eager: [
              { width: 300, height: 300, crop: 'pad', audio_codec: 'none' },
              { width: 160, height: 100, crop: 'crop', gravity: 'south', audio_codec: 'none' }
            ],
            eager_async: true
          })
        },
        (error, result) => {
          if (error) {
            console.error('❌ [CLOUDINARY] Upload error:', error);
            reject(new Error(`Failed to upload file to Cloudinary: ${error.message}`));
          } else {
            console.log(`✅ [CLOUDINARY] File uploaded successfully`);
            console.log(`🔗 [CLOUDINARY] URL: ${result.secure_url}`);
            console.log(`🆔 [CLOUDINARY] Public ID: ${result.public_id}`);
            
            resolve({
              cloudinaryURL: result.secure_url,
              publicId: result.public_id,
              uniqueFileName: uniqueFileName + fileExt,
              resourceType: result.resource_type,
              format: result.format,
              width: result.width,
              height: result.height,
              duration: result.duration, // For videos
              bytes: result.bytes
            });
          }
        }
      );
      
      // Write buffer to stream
      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    console.error('❌ [CLOUDINARY] Error in uploadFile:', error);
    throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 * @param {string} resourceType - Resource type (image, video, raw)
 * @returns {Promise<void>}
 */
const deleteFile = async (publicId, resourceType = 'raw') => {
  try {
    console.log(`🗑️ [CLOUDINARY] Deleting file: ${publicId} (${resourceType})`);
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true
    });
    
    if (result.result === 'ok' || result.result === 'not found') {
      console.log(`✅ [CLOUDINARY] File deleted successfully: ${publicId}`);
    } else {
      console.warn(`⚠️ [CLOUDINARY] Unexpected delete result: ${result.result}`);
    }
  } catch (error) {
    console.error('❌ [CLOUDINARY] Error deleting file:', error);
    console.error('❌ [CLOUDINARY] Error details:', {
      message: error.message,
      publicId: publicId
    });
    
    // Don't throw error - log warning instead
    console.warn(`⚠️ [CLOUDINARY] Could not delete file (may already be deleted): ${publicId}`);
  }
};

/**
 * Get resource type from file extension
 * @param {string} fileName - File name with extension
 * @returns {string} - Resource type for Cloudinary
 */
const getResourceType = (fileName) => {
  const ext = fileName.toLowerCase().split('.').pop();
  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'];
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  
  if (videoExtensions.includes(ext)) {
    return 'video';
  } else if (imageExtensions.includes(ext)) {
    return 'image';
  } else {
    return 'raw'; // For PDFs and other documents
  }
};

module.exports = {
  cloudinary,
  uploadFile,
  deleteFile,
  getResourceType
};
