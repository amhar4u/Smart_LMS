const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Module = require('../models/Module');
const Subject = require('../models/Subject');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { uploadFile, deleteFile, getResourceType } = require('../config/cloudinary');
const { sendModuleNotification } = require('../services/emailService');

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
const validateModule = [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required'),
  body('description').optional().trim(),
  body('subjectId').isMongoId().withMessage('Valid subject ID is required'),
  body('code').trim().isLength({ min: 1 }).withMessage('Module code is required')
];

// Get all modules with population
router.get('/', auth, async (req, res) => {
  try {
    const { subject, page = 1, limit = 50, search } = req.query;
    
    // Build filter - don't filter by isActive if it doesn't exist
    let filter = {};
    
    if (subject) {
      filter.subject = subject;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get modules with pagination
    const modules = await Module.find(filter)
      .populate('subject', 'name code departmentId courseId batchId semesterId')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalItems = await Module.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);
    
    res.json({
      success: true,
      message: 'Modules fetched successfully',
      data: {
        modules,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('❌ [MODULES] Error fetching modules:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch modules',
      error: error.message 
    });
  }
});

// Get modules by subject
router.get('/subject/:subjectId', auth, async (req, res) => {
  try {
    const modules = await Module.find({ 
      subject: req.params.subjectId,
      isActive: true 
    })
      .populate({
        path: 'subject',
        select: 'name code departmentId courseId batchId semesterId',
        populate: [
          {
            path: 'departmentId',
            select: 'name code'
          },
          {
            path: 'courseId', 
            select: 'name code'
          },
          {
            path: 'batchId',
            select: 'name code'
          },
          {
            path: 'semesterId',
            select: 'name code year type'
          }
        ]
      })
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      message: 'Modules fetched successfully',
      data: { modules }
    });
  } catch (error) {
    console.error('❌ [MODULES] Error fetching modules by subject:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch modules by subject',
      error: error.message 
    });
  }
});

// Get single module
router.get('/:id', auth, async (req, res) => {
  try {
    const module = await Module.findById(req.params.id)
      .populate({
        path: 'subject',
        select: 'name code departmentId courseId batchId semesterId',
        populate: [
          {
            path: 'departmentId',
            select: 'name code'
          },
          {
            path: 'courseId', 
            select: 'name code'
          },
          {
            path: 'batchId',
            select: 'name code'
          },
          {
            path: 'semesterId',
            select: 'name code year type'
          }
        ]
      })
      .populate('createdBy', 'firstName lastName email');
    
    if (!module) {
      return res.status(404).json({ 
        success: false,
        message: 'Module not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Module fetched successfully',
      data: module
    });
  } catch (error) {
    console.error('❌ [MODULES] Error fetching module:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch module',
      error: error.message 
    });
  }
});

// Create module with file uploads
router.post('/', auth, upload.fields([
  { name: 'documents', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]), validateModule, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, name, description, subjectId, code } = req.body;

    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(400).json({ message: 'Subject not found' });
    }

    // Check if module code already exists for this subject
    const existingModule = await Module.findOne({ 
      code: code, 
      subject: subjectId 
    });
    
    if (existingModule) {
      return res.status(400).json({ 
        message: 'Module with this code already exists for the selected subject' 
      });
    }

    // Validate that at least one document is provided (mandatory)
    if (!req.files || !req.files.documents || req.files.documents.length === 0) {
      return res.status(400).json({ 
        message: 'At least one PDF document is required' 
      });
    }

    const module = new Module({
      title,
      name,
      description,
      code,
      subject: subjectId,
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
            'modules/documents'
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
          'modules/videos'
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
        // Just log the error and continue without video
      }
    }

    module.documents = documents;
    module.video = video;

    await module.save();

    const savedModule = await Module.findById(module._id)
      .populate('subject', 'name code')
      .populate('createdBy', 'name email');

    // Send email notifications
    try {
      // Get subject with batch and semester info
      const subjectFull = await Subject.findById(subjectId)
        .populate('lecturerId', 'firstName lastName email')
        .populate('batchId')
        .populate('semesterId');
      
      if (subjectFull && subjectFull.batchId && subjectFull.semesterId) {
        // Get enrolled students
        const enrolledStudents = await User.find({
          role: 'student',
          status: 'approved',
          isActive: true,
          batch: subjectFull.batchId._id,
          semester: subjectFull.semesterId._id
        }).select('firstName lastName email');

        console.log(`📧 [MODULE] Sending notifications for module: ${title}`);
        
        // If created by admin, send to both lecturer and students
        if (req.user.role === 'admin') {
          // Send to lecturer
          if (subjectFull.lecturerId) {
            sendModuleNotification(subjectFull.lecturerId, { ...savedModule.toObject(), subjectId: subjectFull }, 'lecturer')
              .catch(err => console.error('Failed to send lecturer email:', err));
          }
          
          // Send to students
          console.log(`   Sending to ${enrolledStudents.length} students...`);
          enrolledStudents.forEach(student => {
            sendModuleNotification(student, { ...savedModule.toObject(), subjectId: subjectFull }, 'student')
              .catch(err => console.error(`Failed to send email to student ${student.email}:`, err));
          });
        } 
        // If created by lecturer, send only to students
        else if (req.user.role === 'teacher') {
          console.log(`   Sending to ${enrolledStudents.length} students...`);
          enrolledStudents.forEach(student => {
            sendModuleNotification(student, { ...savedModule.toObject(), subjectId: subjectFull }, 'student')
              .catch(err => console.error(`Failed to send email to student ${student.email}:`, err));
          });
        }
      }
    } catch (emailError) {
      console.error('❌ [MODULE] Email notification error:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      message: 'Module created successfully',
      module: savedModule
    });

  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update module
router.put('/:id', auth, upload.fields([
  { name: 'documents', maxCount: 10 },
  { name: 'video', maxCount: 1 }
]), validateModule, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const { title, name, description, subjectId, code } = req.body;

    // Check if subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(400).json({ message: 'Subject not found' });
    }

    // Update basic fields
    module.title = title;
    module.name = name;
    module.description = description;
    module.code = code;
    module.subject = subjectId;

    // Handle new document uploads to Cloudinary
    if (req.files && req.files.documents) {
      const newDocuments = [];
      for (const file of req.files.documents) {
        try {
          const uploadResult = await uploadFile(
            file.buffer, 
            file.originalname, 
            'modules/documents'
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
      module.documents = [...module.documents, ...newDocuments];
    }

    // Handle video replacement
    if (req.files && req.files.video && req.files.video[0]) {
      // Delete old video from Cloudinary if exists
      if (module.video && module.video.publicId) {
        try {
          await deleteFile(module.video.publicId, module.video.resourceType || 'video');
        } catch (deleteError) {
          console.error('Error deleting old video from Cloudinary:', deleteError);
          // Continue with upload even if deletion fails
        }
      }

      const videoFile = req.files.video[0];
      try {
        const uploadResult = await uploadFile(
          videoFile.buffer, 
          videoFile.originalname, 
          'modules/videos'
        );
        
        module.video = {
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

    await module.save();

    const updatedModule = await Module.findById(module._id)
      .populate('subject', 'name code')
      .populate('createdBy', 'name email');

    res.json({
      message: 'Module updated successfully',
      module: updatedModule
    });

  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete document from module
router.delete('/:id/documents/:documentId', auth, async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const documentIndex = module.documents.findIndex(
      doc => doc._id.toString() === req.params.documentId
    );

    if (documentIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const document = module.documents[documentIndex];

    // Delete from Cloudinary if publicId exists
    if (document.publicId) {
      try {
        await deleteFile(document.publicId, document.resourceType || 'raw');
      } catch (deleteError) {
        console.error('Error deleting document from Cloudinary:', deleteError);
        // Continue with removal from database even if Cloudinary deletion fails
      }
    }

    // Remove document from array
    module.documents.splice(documentIndex, 1);
    
    // Check if module still has at least one document (since documents are mandatory)
    if (module.documents.length === 0) {
      return res.status(400).json({ 
        message: 'Cannot delete the last document. Modules must have at least one document.' 
      });
    }

    await module.save();

    res.json({
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add document to existing module
router.post('/:id/documents', auth, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    try {
      const uploadResult = await uploadFile(
        req.file.buffer, 
        req.file.originalname, 
        'modules/documents'
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

      module.documents.push(newDocument);
      await module.save();

      res.json({
        message: 'Document added successfully',
        document: newDocument
      });
    } catch (uploadError) {
      console.error('Error uploading document to Cloudinary:', uploadError);
      return res.status(500).json({ 
        message: 'Failed to upload document to cloud storage' 
      });
    }

  } catch (error) {
    console.error('Error adding document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update module video
router.put('/:id/video', auth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Delete existing video from Cloudinary if exists
    if (module.video && module.video.publicId) {
      try {
        await deleteFile(module.video.publicId, module.video.resourceType || 'video');
      } catch (deleteError) {
        console.error('Error deleting old video from Cloudinary:', deleteError);
        // Continue with upload even if deletion fails
      }
    }

    try {
      const uploadResult = await uploadFile(
        req.file.buffer, 
        req.file.originalname, 
        'modules/videos'
      );
      
      module.video = {
        name: req.file.originalname,
        uniqueName: uploadResult.uniqueFileName,
        cloudinaryURL: uploadResult.cloudinaryURL,
        publicId: uploadResult.publicId,
        resourceType: uploadResult.resourceType,
        fileType: path.extname(req.file.originalname),
        size: uploadResult.bytes || req.file.size,
        duration: uploadResult.duration
      };

      await module.save();

      res.json({
        message: 'Video updated successfully',
        video: module.video
      });
    } catch (uploadError) {
      console.error('Error uploading video to Cloudinary:', uploadError);
      return res.status(500).json({ 
        message: 'Failed to upload video to cloud storage' 
      });
    }

  } catch (error) {
    console.error('Error updating video:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete document
router.delete('/:id/documents/:documentId', auth, async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const documentIndex = module.documents.findIndex(
      doc => doc._id.toString() === req.params.documentId
    );

    if (documentIndex === -1) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const document = module.documents[documentIndex];
    
    // Delete local file
    if (document.localPath && fs.existsSync(document.localPath)) {
      fs.unlinkSync(document.localPath);
    }

    module.documents.splice(documentIndex, 1);
    await module.save();

    res.json({ message: 'Document deleted successfully' });

  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete video
router.delete('/:id/video', auth, async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    if (!module.video) {
      return res.status(404).json({ message: 'No video found for this module' });
    }

    // Delete local file
    if (module.video.localPath && fs.existsSync(module.video.localPath)) {
      fs.unlinkSync(module.video.localPath);
    }

    module.video = null;
    await module.save();

    res.json({ message: 'Video deleted successfully' });

  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete module
router.delete('/:id', auth, async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    // Delete all associated files from Cloudinary
    for (const doc of module.documents) {
      if (doc.publicId) {
        try {
          await deleteFile(doc.publicId, doc.resourceType || 'raw');
        } catch (deleteError) {
          console.error('Error deleting document from Cloudinary:', deleteError);
          // Continue with other deletions even if one fails
        }
      }
    }

    if (module.video && module.video.publicId) {
      try {
        await deleteFile(module.video.publicId, module.video.resourceType || 'video');
      } catch (deleteError) {
        console.error('Error deleting video from Cloudinary:', deleteError);
        // Continue with module deletion even if Cloudinary deletion fails
      }
    }

    await Module.findByIdAndDelete(req.params.id);

    res.json({ message: 'Module and all associated files deleted successfully' });

  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download file endpoint
router.get('/:id/download/:fileType/:fileName', async (req, res) => {
  try {
    const { id, fileType, fileName } = req.params;
    
    const module = await Module.findById(id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    let filePath;
    
    if (fileType === 'video' && module.video && module.video.uniqueName === fileName) {
      filePath = module.video.localPath;
    } else if (fileType === 'document') {
      const document = module.documents.find(doc => doc.uniqueName === fileName);
      if (document) {
        filePath = document.localPath;
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle module status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }

    module.isActive = !module.isActive;
    await module.save();

    const updatedModule = await Module.findById(module._id)
      .populate('subject', 'name code')
      .populate('createdBy', 'name email');

    res.json({
      message: `Module ${module.isActive ? 'activated' : 'deactivated'} successfully`,
      module: updatedModule
    });

  } catch (error) {
    console.error('Error toggling module status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
