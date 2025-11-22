const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const Module = require('../models/Module');
const Subject = require('../models/Subject');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/modules';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow all file types for now
    cb(null, true);
  }
});

// Validation middleware
const validateModule = [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').optional().trim(),
  body('subjectId').isMongoId().withMessage('Valid subject ID is required'),
  body('code').trim().isLength({ min: 1 }).withMessage('Module code is required')
];

// Get all modules with population
router.get('/', async (req, res) => {
  try {
    const modules = await Module.find()
      .populate('subject', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get modules by subject
router.get('/subject/:subjectId', async (req, res) => {
  try {
    const modules = await Module.find({ subject: req.params.subjectId })
      .populate('subject', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(modules);
  } catch (error) {
    console.error('Error fetching modules by subject:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single module
router.get('/:id', async (req, res) => {
  try {
    const module = await Module.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('createdBy', 'name email');
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    res.json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ message: 'Server error' });
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

    let { title, description, subjectId, code, department, course, batch, semester } = req.body;

    // Check if subject exists and populate relationships for auto-population
    const subject = await Subject.findById(subjectId)
      .populate('departmentId')
      .populate('courseId')
      .populate('batchId')
      .populate('semesterId');
      
    if (!subject) {
      return res.status(400).json({ message: 'Subject not found' });
    }

    // Auto-populate department/course/batch/semester from subject if not provided (for lecturers)
    if (!department && subject.departmentId) {
      department = subject.departmentId._id || subject.departmentId;
    }
    if (!course && subject.courseId) {
      course = subject.courseId._id || subject.courseId;
    }
    if (!batch && subject.batchId) {
      batch = subject.batchId._id || subject.batchId;
    }
    if (!semester && subject.semesterId) {
      semester = subject.semesterId._id || subject.semesterId;
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

    const module = new Module({
      title,
      description,
      code,
      subject: subjectId,
      createdBy: req.user.id
    });

    // Handle document uploads
    const documents = [];
    if (req.files && req.files.documents) {
      for (const file of req.files.documents) {
        documents.push({
          name: file.originalname,
          uniqueName: file.filename,
          localPath: file.path,
          fileType: path.extname(file.originalname),
          size: file.size
        });
      }
    }

    // Handle video upload
    let video = null;
    if (req.files && req.files.video && req.files.video[0]) {
      const videoFile = req.files.video[0];
      video = {
        name: videoFile.originalname,
        uniqueName: videoFile.filename,
        localPath: videoFile.path,
        fileType: path.extname(videoFile.originalname),
        size: videoFile.size
      };
    }

    module.documents = documents;
    module.video = video;

    await module.save();

    const savedModule = await Module.findById(module._id)
      .populate('subject', 'name code')
      .populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Module created successfully',
      module: savedModule
    });

  } catch (error) {
    console.error('Error creating module:', error);
    
    // Clean up uploaded files in case of error
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
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

    let { title, description, subjectId, code, department, course, batch, semester } = req.body;

    // Check if subject exists and populate relationships for auto-population
    const subject = await Subject.findById(subjectId)
      .populate('departmentId')
      .populate('courseId')
      .populate('batchId')
      .populate('semesterId');
      
    if (!subject) {
      return res.status(400).json({ message: 'Subject not found' });
    }

    // Auto-populate department/course/batch/semester from subject if not provided (for lecturers)
    if (!department && subject.departmentId) {
      department = subject.departmentId._id || subject.departmentId;
    }
    if (!course && subject.courseId) {
      course = subject.courseId._id || subject.courseId;
    }
    if (!batch && subject.batchId) {
      batch = subject.batchId._id || subject.batchId;
    }
    if (!semester && subject.semesterId) {
      semester = subject.semesterId._id || subject.semesterId;
    }

    // Update basic fields
    module.title = title;
    module.description = description;
    module.code = code;
    module.subject = subjectId;

    // Handle new document uploads
    if (req.files && req.files.documents) {
      const newDocuments = [];
      for (const file of req.files.documents) {
        newDocuments.push({
          name: file.originalname,
          uniqueName: file.filename,
          localPath: file.path,
          fileType: path.extname(file.originalname),
          size: file.size
        });
      }
      module.documents = [...module.documents, ...newDocuments];
    }

    // Handle video replacement
    if (req.files && req.files.video && req.files.video[0]) {
      // Delete old video file if exists
      if (module.video && module.video.localPath && fs.existsSync(module.video.localPath)) {
        fs.unlinkSync(module.video.localPath);
      }

      const videoFile = req.files.video[0];
      module.video = {
        name: videoFile.originalname,
        uniqueName: videoFile.filename,
        localPath: videoFile.path,
        fileType: path.extname(videoFile.originalname),
        size: videoFile.size
      };
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
    
    // Clean up uploaded files in case of error
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
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

    const newDocument = {
      name: req.file.originalname,
      uniqueName: req.file.filename,
      localPath: req.file.path,
      fileType: path.extname(req.file.originalname),
      size: req.file.size
    };

    module.documents.push(newDocument);
    await module.save();

    res.json({
      message: 'Document added successfully',
      document: newDocument
    });

  } catch (error) {
    console.error('Error adding document:', error);
    
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
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

    // Delete existing video file if exists
    if (module.video && module.video.localPath && fs.existsSync(module.video.localPath)) {
      fs.unlinkSync(module.video.localPath);
    }

    module.video = {
      name: req.file.originalname,
      uniqueName: req.file.filename,
      localPath: req.file.path,
      fileType: path.extname(req.file.originalname),
      size: req.file.size
    };

    await module.save();

    res.json({
      message: 'Video updated successfully',
      video: module.video
    });

  } catch (error) {
    console.error('Error updating video:', error);
    
    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
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

    // Delete all associated files
    module.documents.forEach(doc => {
      if (doc.localPath && fs.existsSync(doc.localPath)) {
        fs.unlinkSync(doc.localPath);
      }
    });

    if (module.video && module.video.localPath && fs.existsSync(module.video.localPath)) {
      fs.unlinkSync(module.video.localPath);
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
