const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const ExtraModule = require('../models/ExtraModule');
const Subject = require('../models/Subject');
const auth = require('../middleware/auth');
const { uploadFile, deleteFile, getResourceType } = require('../config/cloudinary');

const router = express.Router();

// Configure multer for file uploads (store in memory for Cloudinary upload)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow PDF files for documents
    if (file.fieldname === 'documents') {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed for documents'), false);
      }
    }
    // Allow video files for video
    else if (file.fieldname === 'video') {
      if (file.mimetype.startsWith('video/')) {
        cb(null, true);
      } else {
        cb(new Error('Only video files are allowed'), false);
      }
    } else {
      cb(null, true);
    }
  }
});

// Validation middleware
const validateExtraModule = [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('description').optional().trim(),
  body('subjectId').isMongoId().withMessage('Valid subject ID is required'),
  body('code').trim().isLength({ min: 1 }).withMessage('Extra module code is required'),
  body('studentLevel').isIn(['Beginner', 'Intermediate', 'Advanced', 'All']).withMessage('Invalid student level')
];

// Get all extra modules with population
router.get('/', auth, async (req, res) => {
  try {
    console.log('📋 [EXTRA MODULES] Fetching all extra modules');
    
    const { subject, studentLevel, page = 1, limit = 50, search } = req.query;
    
    // Build filter
    let filter = {};
    
    if (subject) {
      filter.subject = subject;
    }
    
    if (studentLevel && studentLevel !== 'All') {
      filter.studentLevel = { $in: [studentLevel, 'All'] };
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    console.log('📋 [EXTRA MODULES] Filter:', filter);
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get extra modules with pagination
    const extraModules = await ExtraModule.find(filter)
      .populate('subject', 'name code departmentId courseId batchId semesterId')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalItems = await ExtraModule.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);
    
    console.log(`✅ [EXTRA MODULES] Found ${extraModules.length} extra modules (${totalItems} total)`);
    
    res.json({
      success: true,
      message: 'Extra modules fetched successfully',
      data: {
        extraModules,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ [EXTRA MODULES] Error fetching extra modules:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch extra modules',
      error: error.message 
    });
  }
});

// Get extra modules by subject
router.get('/subject/:subjectId', auth, async (req, res) => {
  try {
    console.log(`📋 [EXTRA MODULES] Fetching extra modules for subject: ${req.params.subjectId}`);
    
    const { studentLevel } = req.query;
    let filter = { 
      subject: req.params.subjectId,
      isActive: true 
    };
    
    if (studentLevel && studentLevel !== 'All') {
      filter.studentLevel = { $in: [studentLevel, 'All'] };
    }
    
    const extraModules = await ExtraModule.find(filter)
      .populate({
        path: 'subject',
        select: 'name code departmentId courseId batchId semesterId',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'courseId', select: 'name code' },
          { path: 'batchId', select: 'name code' },
          { path: 'semesterId', select: 'name code year type' }
        ]
      })
      .populate('createdBy', 'firstName lastName email')
      .sort({ order: 1, createdAt: -1 });
    
    console.log(`✅ [EXTRA MODULES] Found ${extraModules.length} extra modules for subject`);
    
    res.json({
      success: true,
      message: 'Extra modules fetched successfully',
      data: { extraModules }
    });
  } catch (error) {
    console.error('❌ [EXTRA MODULES] Error fetching extra modules by subject:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch extra modules by subject',
      error: error.message 
    });
  }
});

// Get extra modules by student level
router.get('/level/:studentLevel', auth, async (req, res) => {
  try {
    console.log(`📋 [EXTRA MODULES] Fetching extra modules for level: ${req.params.studentLevel}`);
    
    const extraModules = await ExtraModule.findByStudentLevel(req.params.studentLevel);
    
    console.log(`✅ [EXTRA MODULES] Found ${extraModules.length} extra modules for level`);
    
    res.json({
      success: true,
      message: 'Extra modules fetched successfully',
      data: { extraModules }
    });
  } catch (error) {
    console.error('❌ [EXTRA MODULES] Error fetching extra modules by level:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch extra modules by level',
      error: error.message 
    });
  }
});

// Get single extra module
router.get('/:id', auth, async (req, res) => {
  try {
    console.log(`📋 [EXTRA MODULES] Fetching extra module: ${req.params.id}`);
    
    const extraModule = await ExtraModule.findById(req.params.id)
      .populate({
        path: 'subject',
        select: 'name code departmentId courseId batchId semesterId',
        populate: [
          { path: 'departmentId', select: 'name code' },
          { path: 'courseId', select: 'name code' },
          { path: 'batchId', select: 'name code' },
          { path: 'semesterId', select: 'name code year type' }
        ]
      })
      .populate('createdBy', 'firstName lastName email');
    
    if (!extraModule) {
      console.log(`❌ [EXTRA MODULES] Extra module not found: ${req.params.id}`);
      return res.status(404).json({ 
        success: false,
        message: 'Extra module not found' 
      });
    }
    
    console.log(`✅ [EXTRA MODULES] Extra module found: ${extraModule.title}`);
    
    res.json({
      success: true,
      message: 'Extra module fetched successfully',
      data: extraModule
    });
  } catch (error) {
    console.error('❌ [EXTRA MODULES] Error fetching extra module:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch extra module',
      error: error.message 
    });
  }
});

// Create extra module with file uploads
router.post('/', auth, upload.fields([
  { name: 'documents', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]), validateExtraModule, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, name, description, subjectId, code, studentLevel } = req.body;

    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(400).json({ message: 'Subject not found' });
    }

    // Check if extra module code already exists for this subject
    const existingExtraModule = await ExtraModule.findOne({ 
      code: code, 
      subject: subjectId 
    });
    
    if (existingExtraModule) {
      return res.status(400).json({ 
        message: 'Extra module with this code already exists for the selected subject' 
      });
    }

    // Validate that at least one document is provided (mandatory)
    if (!req.files || !req.files.documents || req.files.documents.length === 0) {
      return res.status(400).json({ 
        message: 'At least one PDF document is required' 
      });
    }

    const extraModule = new ExtraModule({
      title,
      name,
      description,
      code,
      subject: subjectId,
      studentLevel: studentLevel || 'All',
      createdBy: req.user.id
    });

    // Handle document uploads to Cloudinary
    const documents = [];
    if (req.files && req.files.documents) {
      for (const file of req.files.documents) {
        try {
          const uploadResult = await uploadFile(
            file.buffer, 
            file.originalname, 
            'extra-modules/documents'
          );
          
          documents.push({
            name: file.originalname,
            uniqueName: uploadResult.uniqueFileName,
            cloudinaryURL: uploadResult.cloudinaryURL,
            publicId: uploadResult.publicId,
            resourceType: uploadResult.resourceType,
            fileType: path.extname(file.originalname),
            size: uploadResult.bytes || file.size
          });
        } catch (uploadError) {
          console.error('Error uploading document to Cloudinary:', uploadError);
          return res.status(500).json({ 
            message: 'Failed to upload document to cloud storage' 
          });
        }
      }
    }

    // Handle video upload to Cloudinary (optional)
    let video = null;
    if (req.files && req.files.video && req.files.video[0]) {
      const videoFile = req.files.video[0];
      try {
        const uploadResult = await uploadFile(
          videoFile.buffer, 
          videoFile.originalname, 
          'extra-modules/videos'
        );
        
        video = {
          name: videoFile.originalname,
          uniqueName: uploadResult.uniqueFileName,
          cloudinaryURL: uploadResult.cloudinaryURL,
          publicId: uploadResult.publicId,
          resourceType: uploadResult.resourceType,
          fileType: path.extname(videoFile.originalname),
          size: uploadResult.bytes || videoFile.size,
          duration: uploadResult.duration
        };
      } catch (uploadError) {
        console.error('Error uploading video to Cloudinary:', uploadError);
        // Don't fail the entire request for optional video upload
      }
    }

    extraModule.documents = documents;
    extraModule.video = video;

    await extraModule.save();

    const savedExtraModule = await ExtraModule.findById(extraModule._id)
      .populate('subject', 'name code')
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Extra module created successfully',
      data: savedExtraModule
    });

  } catch (error) {
    console.error('Error creating extra module:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Update extra module
router.put('/:id', auth, upload.fields([
  { name: 'documents', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]), validateExtraModule, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const extraModule = await ExtraModule.findById(req.params.id);
    if (!extraModule) {
      return res.status(404).json({ message: 'Extra module not found' });
    }

    const { title, name, description, subjectId, code, studentLevel } = req.body;

    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(400).json({ message: 'Subject not found' });
    }

    // Update basic fields
    extraModule.title = title;
    extraModule.name = name;
    extraModule.description = description;
    extraModule.code = code;
    extraModule.subject = subjectId;
    extraModule.studentLevel = studentLevel || extraModule.studentLevel;
    extraModule.updatedBy = req.user.id;

    // Handle new document uploads to Cloudinary
    if (req.files && req.files.documents) {
      const newDocuments = [];
      for (const file of req.files.documents) {
        try {
          const uploadResult = await uploadFile(
            file.buffer, 
            file.originalname, 
            'extra-modules/documents'
          );
          
          newDocuments.push({
            name: file.originalname,
            uniqueName: uploadResult.uniqueFileName,
            cloudinaryURL: uploadResult.cloudinaryURL,
            publicId: uploadResult.publicId,
            resourceType: uploadResult.resourceType,
            fileType: path.extname(file.originalname),
            size: uploadResult.bytes || file.size
          });
        } catch (uploadError) {
          console.error('Error uploading document to Cloudinary:', uploadError);
          return res.status(500).json({ 
            message: 'Failed to upload document to cloud storage' 
          });
        }
      }
      extraModule.documents = [...extraModule.documents, ...newDocuments];
    }

    // Handle video replacement
    if (req.files && req.files.video && req.files.video[0]) {
      // Delete old video from Cloudinary if exists
      if (extraModule.video && extraModule.video.publicId) {
        try {
          await deleteFile(extraModule.video.publicId, extraModule.video.resourceType || 'video');
        } catch (deleteError) {
          console.error('Error deleting old video from Cloudinary:', deleteError);
        }
      }

      const videoFile = req.files.video[0];
      try {
        const uploadResult = await uploadFile(
          videoFile.buffer, 
          videoFile.originalname, 
          'extra-modules/videos'
        );
        
        extraModule.video = {
          name: videoFile.originalname,
          uniqueName: uploadResult.uniqueFileName,
          cloudinaryURL: uploadResult.cloudinaryURL,
          publicId: uploadResult.publicId,
          resourceType: uploadResult.resourceType,
          fileType: path.extname(videoFile.originalname),
          size: uploadResult.bytes || videoFile.size,
          duration: uploadResult.duration
        };
      } catch (uploadError) {
        console.error('Error uploading video to Cloudinary:', uploadError);
        return res.status(500).json({ 
          message: 'Failed to upload video to cloud storage' 
        });
      }
    }

    await extraModule.save();

    const updatedExtraModule = await ExtraModule.findById(extraModule._id)
      .populate('subject', 'name code')
      .populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Extra module updated successfully',
      data: updatedExtraModule
    });

  } catch (error) {
    console.error('Error updating extra module:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Delete document from extra module
router.delete('/:id/documents/:documentId', auth, async (req, res) => {
  try {
    const extraModule = await ExtraModule.findById(req.params.id);
    if (!extraModule) {
      return res.status(404).json({ message: 'Extra module not found' });
    }

    const documentIndex = extraModule.documents.findIndex(
      doc => doc._id.toString() === req.params.documentId
    );

    if (documentIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const document = extraModule.documents[documentIndex];

    // Delete from Cloudinary if publicId exists
    if (document.publicId) {
      try {
        await deleteFile(document.publicId, document.resourceType || 'raw');
      } catch (deleteError) {
        console.error('Error deleting document from Cloudinary:', deleteError);
      }
    }

    // Remove document from array
    extraModule.documents.splice(documentIndex, 1);
    
    // Check if extra module still has at least one document
    if (extraModule.documents.length === 0) {
      return res.status(400).json({ 
        message: 'Cannot delete the last document. Extra modules must have at least one document.' 
      });
    }

    await extraModule.save();

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Add document to existing extra module
router.post('/:id/documents', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const extraModule = await ExtraModule.findById(req.params.id);
    if (!extraModule) {
      return res.status(404).json({ message: 'Extra module not found' });
    }

    try {
      const uploadResult = await uploadFile(
        req.file.buffer, 
        req.file.originalname, 
        'extra-modules/documents'
      );
      
      const newDocument = {
        name: req.file.originalname,
        uniqueName: uploadResult.uniqueFileName,
        cloudinaryURL: uploadResult.cloudinaryURL,
        publicId: uploadResult.publicId,
        resourceType: uploadResult.resourceType,
        fileType: path.extname(req.file.originalname),
        size: uploadResult.bytes || req.file.size
      };

      extraModule.documents.push(newDocument);
      await extraModule.save();

      res.json({
        success: true,
        message: 'Document added successfully',
        data: newDocument
      });
    } catch (uploadError) {
      console.error('Error uploading document to Cloudinary:', uploadError);
      return res.status(500).json({ 
        message: 'Failed to upload document to cloud storage' 
      });
    }

  } catch (error) {
    console.error('Error adding document:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Update extra module video
router.put('/:id/video', auth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const extraModule = await ExtraModule.findById(req.params.id);
    if (!extraModule) {
      return res.status(404).json({ message: 'Extra module not found' });
    }

    // Delete existing video from Cloudinary if exists
    if (extraModule.video && extraModule.video.publicId) {
      try {
        await deleteFile(extraModule.video.publicId, extraModule.video.resourceType || 'video');
      } catch (deleteError) {
        console.error('Error deleting old video from Cloudinary:', deleteError);
      }
    }

    try {
      const uploadResult = await uploadFile(
        req.file.buffer, 
        req.file.originalname, 
        'extra-modules/videos'
      );
      
      extraModule.video = {
        name: req.file.originalname,
        uniqueName: uploadResult.uniqueFileName,
        cloudinaryURL: uploadResult.cloudinaryURL,
        publicId: uploadResult.publicId,
        resourceType: uploadResult.resourceType,
        fileType: path.extname(req.file.originalname),
        size: uploadResult.bytes || req.file.size,
        duration: uploadResult.duration
      };

      await extraModule.save();

      res.json({
        success: true,
        message: 'Video updated successfully',
        data: extraModule.video
      });
    } catch (uploadError) {
      console.error('Error uploading video to Cloudinary:', uploadError);
      return res.status(500).json({ 
        message: 'Failed to upload video to cloud storage' 
      });
    }

  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Delete video
router.delete('/:id/video', auth, async (req, res) => {
  try {
    const extraModule = await ExtraModule.findById(req.params.id);
    if (!extraModule) {
      return res.status(404).json({ message: 'Extra module not found' });
    }

    if (!extraModule.video) {
      return res.status(404).json({ message: 'No video found for this extra module' });
    }

    // Delete from Cloudinary
    if (extraModule.video.publicId) {
      try {
        await deleteFile(extraModule.video.publicId, extraModule.video.resourceType || 'video');
      } catch (deleteError) {
        console.error('Error deleting video from Cloudinary:', deleteError);
      }
    }

    extraModule.video = null;
    await extraModule.save();

    res.json({ 
      success: true,
      message: 'Video deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Delete extra module
router.delete('/:id', auth, async (req, res) => {
  try {
    const extraModule = await ExtraModule.findById(req.params.id);
    if (!extraModule) {
      return res.status(404).json({ message: 'Extra module not found' });
    }

    // Delete all associated files from Cloudinary
    for (const doc of extraModule.documents) {
      if (doc.publicId) {
        try {
          await deleteFile(doc.publicId, doc.resourceType || 'raw');
        } catch (deleteError) {
          console.error('Error deleting document from Cloudinary:', deleteError);
        }
      }
    }

    if (extraModule.video && extraModule.video.publicId) {
      try {
        await deleteFile(extraModule.video.publicId, extraModule.video.resourceType || 'video');
      } catch (deleteError) {
        console.error('Error deleting video from Cloudinary:', deleteError);
      }
    }

    await ExtraModule.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true,
      message: 'Extra module and all associated files deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting extra module:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

// Toggle extra module status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const extraModule = await ExtraModule.findById(req.params.id);
    if (!extraModule) {
      return res.status(404).json({ message: 'Extra module not found' });
    }

    extraModule.isActive = !extraModule.isActive;
    await extraModule.save();

    const updatedExtraModule = await ExtraModule.findById(extraModule._id)
      .populate('subject', 'name code')
      .populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: `Extra module ${extraModule.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedExtraModule
    });

  } catch (error) {
    console.error('Error toggling extra module status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router;
