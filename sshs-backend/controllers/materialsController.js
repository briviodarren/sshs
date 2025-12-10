const Material = require('../models/materialModel');
const cloudinary = require('../config/cloudinary');
const AdmZip = require('adm-zip');

// Helper to convert buffer to Data URI
const bufferToDataURI = (fileFormat, buffer) => {
  return `data:${fileFormat};base64,${buffer.toString('base64')}`;
};

// @desc    Upload a new material (Zipped)
// @route   POST /api/materials
// @access  Private (Teacher)
const uploadMaterial = async (req, res) => {
  const { title, classId, week } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  if (!classId || !week) {
    return res.status(400).json({ message: 'Class and Week are required' });
  }

  try {
    // 1. Create a ZIP file in memory
    const zip = new AdmZip();
    // Add the uploaded file into the zip, keeping its original name
    zip.addFile(req.file.originalname, req.file.buffer);
    
    const zipBuffer = zip.toBuffer();
    const zipDataUri = bufferToDataURI('application/zip', zipBuffer);

    // 2. Upload the ZIP to Cloudinary
    const result = await cloudinary.uploader.upload(zipDataUri, {
      resource_type: 'raw', 
      folder: 'sshs/materials',
      format: 'zip',        
      public_id: `${Date.now()}_${title.replace(/\s+/g, '_')}`,
      type: 'upload',
      access_mode: 'public'
    });

    // 3. Create DB Record
    const material = await Material.create({
      title,
      class: classId,
      week: week,
      uploadedBy: req.user._id,
      fileUrl: result.secure_url,
      fileType: 'zip', 
      cloudinaryPublicId: result.public_id,
    });

    // 4. Populate and return
    const populatedMaterial = await Material.findById(material._id)
      .populate('uploadedBy', 'name')
      .populate('class', 'name gradeLevel'); // Includes gradeLevel for filtering

    res.status(201).json(populatedMaterial);

  } catch (error) {
    console.error('Material upload error:', error);
    res.status(500).json({ message: 'Server error during upload', error: error.message });
  }
};

// @desc    Get materials based on role
// @route   GET /api/materials
// @access  Private
const getMaterials = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      // STRICT: Students only see materials for classes they are enrolled in
      query = { class: { $in: req.user.classes } };
    } else if (req.user.role === 'teacher') {
      // STRICT: Teachers only see materials they uploaded
      query = { uploadedBy: req.user._id };
    }
    // Admin sees everything (empty query)

    const materials = await Material.find(query)
      .populate('uploadedBy', 'name')
      .populate('class', 'name gradeLevel') // Important for the Grade Filter
      .populate('views', 'name')
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Material
// @route   PUT /api/materials/:id
// @access  Private (Teacher/Admin)
const updateMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: 'Not found' });

    // Ownership check
    if (req.user.role !== 'admin' && material.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { title, classId, week } = req.body;
    if (title) material.title = title;
    if (classId) material.class = classId;
    if (week) material.week = week;

    // Handle File Replace
    if (req.file) {
      // Delete old file
      if (material.cloudinaryPublicId) {
          try {
            await cloudinary.uploader.destroy(material.cloudinaryPublicId, { resource_type: 'raw' });
          } catch (e) { console.log("Delete error", e); }
      }

      // Zip new file
      const zip = new AdmZip();
      zip.addFile(req.file.originalname, req.file.buffer);
      const zipDataUri = bufferToDataURI('application/zip', zip.toBuffer());

      // Upload new zip
      const result = await cloudinary.uploader.upload(zipDataUri, {
        resource_type: 'raw', folder: 'sshs/materials', format: 'zip',
        public_id: `${Date.now()}_${material.title.replace(/\s+/g, '_')}`,
        type: 'upload', access_mode: 'public'
      });

      material.fileUrl = result.secure_url;
      material.cloudinaryPublicId = result.public_id;
    }

    await material.save();
    
    // Re-populate for frontend update
    const populated = await Material.findById(material._id)
        .populate('class', 'name gradeLevel')
        .populate('uploadedBy', 'name');
        
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a material
// @route   DELETE /api/materials/:id
// @access  Private (Admin/Teacher)
const deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ message: 'Material not found' });

    // Ownership check
    if (req.user.role !== 'admin' && material.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Try deleting from Cloudinary (Robust delete)
    if (material.cloudinaryPublicId) {
        try {
            await cloudinary.uploader.destroy(material.cloudinaryPublicId, { resource_type: 'raw' });
            await cloudinary.uploader.destroy(material.cloudinaryPublicId, { resource_type: 'video' });
            await cloudinary.uploader.destroy(material.cloudinaryPublicId); // image
        } catch (e) { console.log(e); }
    }

    await material.deleteOne();
    res.json({ message: 'Material removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Track view
// @route   PUT /api/materials/:id/view
const trackView = async (req, res) => {
  try {
    await Material.findByIdAndUpdate(req.params.id, { $addToSet: { views: req.user._id } });
    res.json({ message: 'View tracked' });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = {
  uploadMaterial,
  getMaterials,
  deleteMaterial,
  trackView,
  updateMaterial
};