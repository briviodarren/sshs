const Permit = require('../models/permitModel');
const Attendance = require('../models/attendanceModel');
const User = require('../models/userModel');
const Class = require('../models/classModel');
const cloudinary = require('../config/cloudinary');
const sendNotification = require('../utils/notification');

// Helper: Convert buffer to Data URI
const bufferToDataURI = (fileFormat, buffer) => `data:${fileFormat};base64,${buffer.toString('base64')}`;

// Helper: Get Day Name (e.g., "Monday") from a Date string
const getDayName = (dateString) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(dateString);
  return days[d.getDay()];
};

// Helper: Normalize Date to Midnight UTC to match Attendance Logic
const normalizeDate = (d) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// @desc    Create Permit Request (Auto-Distributes for Full Day)
// @route   POST /api/permits
// @access  Private (Student)
const createPermit = async (req, res) => {
  const { date, reason, classId, isFullDay } = req.body; 
  // Note: FormData sends booleans as strings "true"/"false"
  const isFullDayBool = isFullDay === 'true';
  const dayName = getDayName(date); // e.g., "Monday"

  let fileData = {};

  // 1. Handle File Upload
  if (req.file) {
    try {
      const dataUri = bufferToDataURI(req.file.mimetype, req.file.buffer);
      // Upload as 'raw' to support PDF/Docs/Images without transformation issues
      const result = await cloudinary.uploader.upload(dataUri, {
        resource_type: 'raw', 
        folder: 'sshs/permits', 
        type: 'upload', 
        access_mode: 'public'
      });
      fileData = { fileUrl: result.secure_url, cloudinaryPublicId: result.public_id };
    } catch (error) {
      return res.status(500).json({ message: 'File upload failed' });
    }
  }

  try {
    if (isFullDayBool) {
      // --- OPTION A: Full Day (Create Multiple Permits) ---
      
      const student = await User.findById(req.user._id);
      if (!student.classes || student.classes.length === 0) {
        return res.status(400).json({ message: 'You are not enrolled in any classes.' });
      }

      // Find classes the student is enrolled in THAT MEET ON THIS DAY
      const classesOnDay = await Class.find({
        _id: { $in: student.classes },
        day: dayName 
      });

      if (classesOnDay.length === 0) {
        return res.status(400).json({ message: `You have no classes on ${dayName}.` });
      }

      // Create a permit for each class found
      const promises = classesOnDay.map(cls => {
        return Permit.create({
          student: req.user._id,
          date,
          reason,
          class: cls._id, 
          isFullDay: true, // Just a flag for UI reference
          ...fileData
        });
      });

      await Promise.all(promises);
      res.status(201).json({ message: `Created ${classesOnDay.length} permit requests for ${dayName}.` });

    } else {
      // --- OPTION B: Single Class (Create One Permit) ---
      if (!classId) {
        return res.status(400).json({ message: 'Please select a specific class.' });
      }

      const permit = await Permit.create({
        student: req.user._id,
        date,
        reason,
        class: classId,
        isFullDay: false,
        ...fileData
      });
      res.status(201).json(permit);
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Permits (Filtered by Role)
// @route   GET /api/permits
// @access  Private
const getPermits = async (req, res) => {
  try {
    let query = {};
    
    if (req.user.role === 'student') {
      // Student: See only their own
      query = { student: req.user._id };
    } else if (req.user.role === 'teacher') {
      // Teacher: See ONLY permits for classes they teach
      const teacherClasses = await Class.find({ teacher: req.user._id }).select('_id');
      const classIds = teacherClasses.map(c => c._id);
      
      // Filter permits where the class is in the teacher's list
      query = { class: { $in: classIds } };
    }
    // Admin: Sees everything (query remains empty)

    const permits = await Permit.find(query)
      .populate('student', 'name')
      .populate('class', 'name')
      .sort({ createdAt: -1 }); // Newest first
      
    res.json(permits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Permit Status & Sync Attendance
// @route   PUT /api/permits/:id
// @access  Private (Teacher/Admin)
const updatePermitStatus = async (req, res) => {
  const { status } = req.body; // 'Approved' or 'Rejected'

  try {
    const permit = await Permit.findById(req.params.id);
    if (!permit) return res.status(404).json({ message: 'Permit not found' });

    // Optional: Double check ownership for Teacher
    if (req.user.role === 'teacher') {
        const cls = await Class.findById(permit.class);
        if (cls.teacher.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized for this class' });
        }
    }

    permit.status = status;
    permit.reviewedBy = req.user._id;
    await permit.save();

    // Notify Student
    await sendNotification([permit.student], 'Permit Update', `Your permit request has been ${status}.`);

    // --- LOGIC TRIGGER: Update Attendance ---
    // If approved, automatically mark them as "Excused" in the attendance register
    if (status === 'Approved' && permit.class) {
      const targetStatus = 'Excused'; 
      const normalizedDate = normalizeDate(permit.date); // Ensure time is stripped (00:00:00)

      // Update/Upsert Attendance for this specific student, class, and date
      await Attendance.findOneAndUpdate(
        { 
            student: permit.student, 
            class: permit.class, 
            date: normalizedDate 
        },
        { status: targetStatus },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.json(permit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a permit
// @route   DELETE /api/permits/:id
// @access  Private (Admin)
const deletePermit = async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id);
    if (!permit) return res.status(404).json({ message: 'Permit not found' });

    if (permit.cloudinaryPublicId) {
      try {
        // Try deleting as both raw and image to be safe since uploads vary
        await cloudinary.uploader.destroy(permit.cloudinaryPublicId, { resource_type: 'raw' });
        await cloudinary.uploader.destroy(permit.cloudinaryPublicId); 
      } catch (e) { console.log(e); }
    }

    await permit.deleteOne();
    res.json({ message: 'Permit removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPermit, getPermits, updatePermitStatus, deletePermit };