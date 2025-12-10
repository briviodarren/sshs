const Announcement = require('../models/announcementModel');
const User = require('../models/userModel');
const cloudinary = require('../config/cloudinary');
const sendNotification = require('../utils/notification');

// Helper function to convert buffer to data URI
const bufferToDataURI = (fileFormat, buffer) => {
  return `data:${fileFormat};base64,${buffer.toString('base64')}`;
};

// @desc    Post a new announcement
// @route   POST /api/announcements
// @access  Private (Teacher or Admin)
const postAnnouncement = async (req, res) => {
  const { title, isPinned } = req.body;
  
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded (PDF required)' });
  }
  if (req.file.mimetype !== 'application/pdf') {
     return res.status(400).json({ message: 'Only PDF files are allowed' });
  }

  // Security: Only Admins can pin. Teachers cannot.
  const canPin = req.user.role === 'admin';
  const finalPinnedStatus = canPin ? (isPinned === 'true') : false;

  const dataUri = bufferToDataURI(req.file.mimetype, req.file.buffer);

  try {
    // Upload as 'raw' to bypass image security checks for PDFs
    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: 'raw',
      folder: 'sshs/announcements',
      format: 'pdf',
      type: 'upload',
      access_mode: 'public'
    });

    const announcement = await Announcement.create({
      title,
      postedBy: req.user._id,
      pdfUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
      isPinned: finalPinnedStatus,
    });

    const populated = await Announcement.findById(announcement._id).populate('postedBy', 'name');
    
    // --- NOTIFICATION TRIGGER ---
    // Notify all students and teachers about the new announcement
    try {
        const recipients = await User.find({ role: { $in: ['student', 'teacher'] } }).select('_id');
        const recipientIds = recipients.map(u => u._id);
        
        if (recipientIds.length > 0) {
            await sendNotification(recipientIds, 'New Announcement', `New: ${title}`);
        }
    } catch (notifError) {
        console.error("Notification failed:", notifError.message);
        // Non-blocking: Continue even if notification fails
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({})
      .populate('postedBy', 'name')
      .populate('views', 'name email') // Get viewer names
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an announcement
// @route   DELETE /api/announcements/:id
// @access  Private (Admin)
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Delete PDF from Cloudinary (Try 'raw' type)
    if (announcement.cloudinaryPublicId) {
        try {
            await cloudinary.uploader.destroy(announcement.cloudinaryPublicId, { resource_type: 'raw' });
        } catch (e) {
            console.log("Cloudinary delete warning:", e.message);
        }
    }

    // Delete from DB
    await announcement.deleteOne();

    res.json({ message: 'Announcement removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Edit an announcement (title, pinned status, or PDF)
// @route   PUT /api/announcements/:id
// @access  Private (Admin)
const editAnnouncement = async (req, res) => {
  const { title, isPinned } = req.body;

  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    // Update fields
    if (title) announcement.title = title;
    
    // Only Admin can change pinned status
    if (req.user.role === 'admin' && isPinned !== undefined) {
        announcement.isPinned = (isPinned === 'true');
    }

    // Handle File Replacement
    if (req.file) {
      // Delete old PDF from Cloudinary
      if (announcement.cloudinaryPublicId) {
          try {
            await cloudinary.uploader.destroy(announcement.cloudinaryPublicId, { resource_type: 'raw' });
          } catch (e) { console.log(e); }
      }

      // Upload new PDF
      const dataUri = bufferToDataURI(req.file.mimetype, req.file.buffer);
      const result = await cloudinary.uploader.upload(dataUri, {
        resource_type: 'raw', folder: 'sshs/announcements', format: 'pdf', type: 'upload', access_mode: 'public'
      });
      
      announcement.pdfUrl = result.secure_url;
      announcement.cloudinaryPublicId = result.public_id;
    }

    const updatedAnnouncement = await announcement.save();
    
    // Re-populate everything for frontend
    await updatedAnnouncement.populate('postedBy', 'name');
    await updatedAnnouncement.populate('views', 'name email');
    
    res.json(updatedAnnouncement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Track an announcement view
// @route   PUT /api/announcements/:id/view
// @access  Private (Student)
const trackView = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { views: req.user._id } }, // Only adds if user ID isn't already there
      { new: true }
    );

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }
    res.json({ message: 'View tracked' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  postAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  editAnnouncement,
  trackView,
};