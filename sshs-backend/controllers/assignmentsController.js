const Assignment = require('../models/assignmentModel');
const Submission = require('../models/submissionModel');
const Class = require('../models/classModel');
const cloudinary = require('../config/cloudinary');
const AdmZip = require('adm-zip');
const axios = require('axios');
const sendNotification = require('../utils/notification');

// Helper function to convert buffer to data URI
const bufferToDataURI = (fileFormat, buffer) => {
  return `data:${fileFormat};base64,${buffer.toString('base64')}`;
};

// @desc    Post a new assignment
// @route   POST /api/assignments
// @access  Private (Teacher)
const postAssignment = async (req, res) => {
  const { title, instructions, dueDate, classId } = req.body;
  
  if (!classId) return res.status(400).json({ message: 'Please select a class' });

  let fileData = {};

  // If teacher attaches a reference file
  if (req.file) {
    // 1. VALIDATION: Check if it is a PDF
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Reference file must be a PDF' });
    }

    try {
      const dataUri = bufferToDataURI(req.file.mimetype, req.file.buffer);
      
      // 2. UPLOAD: Use 'raw' and 'public' settings so react-pdf can read it
      const result = await cloudinary.uploader.upload(dataUri, {
        resource_type: 'raw', 
        folder: 'sshs/assignments_ref',
        format: 'pdf',          // Force PDF extension
        type: 'upload',         // Public
        access_mode: 'public'   // Public access
      });
      
      fileData = {
        fileUrl: result.secure_url,
        cloudinaryPublicId: result.public_id
      };
    } catch (error) {
      console.error("Upload failed:", error);
      return res.status(500).json({ message: 'File upload failed', error });
    }
  }

  try {
    const assignment = await Assignment.create({
      title,
      instructions,
      dueDate,
      class: classId,
      teacher: req.user._id,
      ...fileData
    });

    const populatedAssignment = await Assignment.findById(assignment._id)
      .populate('class', 'name gradeLevel')
      .populate('teacher', 'name');

    // --- NOTIFICATION TRIGGER ---
    // Notify students in this class
    try {
        const cls = await Class.findById(classId);
        if (cls && cls.students.length > 0) {
            await sendNotification(cls.students, 'New Assignment', `New assignment posted for ${cls.name}: ${title}`);
        }
    } catch (notifError) {
        console.error("Notification failed:", notifError);
    }

    res.status(201).json(populatedAssignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get assignments based on role
// @route   GET /api/assignments
// @access  Private
const getAssignments = async (req, res) => {
  try {
    let query = {};

    // 1. Student: Only see assignments for classes they are enrolled in
    if (req.user.role === 'student') {
      query = { class: { $in: req.user.classes } };
    } 
    // 2. Teacher: Only see assignments they posted
    else if (req.user.role === 'teacher') {
      query = { teacher: req.user._id };
    }
    // 3. Admin: See everything (query remains empty)

    const assignments = await Assignment.find(query)
      .populate({
        path: 'class',
        select: 'name gradeLevel students', // Include gradeLevel for filtering
        populate: {
          path: 'students',
          select: 'name email' // Deep populate students for the submissions list
        }
      })
      .populate('teacher', 'name')
      .sort({ dueDate: 1 }); // Sort by due date (soonest first)

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Assignment
// @route   PUT /api/assignments/:id
// @access  Private (Teacher/Admin)
const updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Not found' });

    // Check ownership (unless Admin)
    if (req.user.role !== 'admin' && assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to edit this assignment' });
    }

    const { title, instructions, dueDate, classId } = req.body;
    
    if (title) assignment.title = title;
    if (instructions) assignment.instructions = instructions;
    if (dueDate) assignment.dueDate = dueDate;
    if (classId) assignment.class = classId;

    // Handle File Update (If new file sent)
    if (req.file) {
      // Validate PDF
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ message: 'Reference file must be a PDF' });
      }

      // Delete old file
      if (assignment.cloudinaryPublicId) {
        try {
            await cloudinary.uploader.destroy(assignment.cloudinaryPublicId, { resource_type: 'raw' });
        } catch (e) { console.log("Cloudinary delete error:", e.message); }
      }
      
      // Upload new file
      const dataUri = bufferToDataURI(req.file.mimetype, req.file.buffer);
      const result = await cloudinary.uploader.upload(dataUri, {
        resource_type: 'raw', 
        folder: 'sshs/assignments_ref', 
        format: 'pdf', 
        type: 'upload', 
        access_mode: 'public'
      });
      
      assignment.fileUrl = result.secure_url;
      assignment.cloudinaryPublicId = result.public_id;
    }

    await assignment.save();
    const populated = await Assignment.findById(assignment._id).populate('class', 'name gradeLevel');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete Assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Teacher/Admin)
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Not found' });

    if (req.user.role !== 'admin' && assignment.teacher.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this assignment' });
    }

    // Delete Reference File
    if (assignment.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(assignment.cloudinaryPublicId, { resource_type: 'raw' });
      } catch (e) { console.log(e); }
    }

    // Delete all Student Submissions for this assignment (and their files)
    const submissions = await Submission.find({ assignment: assignment._id });
    for (const sub of submissions) {
        // If submissions have public IDs tracked, delete them here.
        // Assuming basic setup for now.
    }
    await Submission.deleteMany({ assignment: assignment._id });

    await assignment.deleteOne();
    res.json({ message: 'Assignment removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit Assignment (Zipped)
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
const submitAssignment = async (req, res) => {
  const assignmentId = req.params.id;

  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a file' });
  }

  try {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Note: Due Date check removed to allow late submissions (marked as late in frontend)

    // 1. Create a ZIP file
    const zip = new AdmZip();
    zip.addFile(req.file.originalname, req.file.buffer);
    const zipBuffer = zip.toBuffer();
    const zipDataUri = bufferToDataURI('application/zip', zipBuffer);

    // 2. Upload ZIP to Cloudinary
    const result = await cloudinary.uploader.upload(zipDataUri, {
      resource_type: 'raw',
      folder: 'sshs/submissions',
      format: 'zip',
      type: 'upload',
      access_mode: 'public',
      public_id: `${Date.now()}_${req.user.name.replace(/\s+/g, '_')}_submission`
    });

    // 3. Handle Re-submission (Update existing or Create new)
    const submission = await Submission.findOneAndUpdate(
      { assignment: assignmentId, student: req.user._id },
      {
        fileUrl: result.secure_url,
        submittedAt: Date.now() // Update timestamp
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Submissions for an assignment
// @route   GET /api/assignments/:id/submissions
// @access  Private
const getSubmissions = async (req, res) => {
  try {
    if (req.user.role === 'student') {
      // Student: Get ONLY their own submission
      const submission = await Submission.findOne({ assignment: req.params.id, student: req.user._id });
      return res.json(submission ? [submission] : []);
    } else {
      // Teacher/Admin: Get ALL submissions
      const submissions = await Submission.find({ assignment: req.params.id })
        .populate('student', 'name email');
      
      res.json(submissions);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all submissions for the logged-in student
// @route   GET /api/assignments/my-submissions
// @access  Private (Student)
const getMySubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download ALL submissions as one ZIP
// @route   GET /api/assignments/:id/download-all
// @access  Private (Teacher/Admin)
const downloadAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment: req.params.id }).populate('student', 'name');

    if (submissions.length === 0) {
      return res.status(404).json({ message: 'No submissions found' });
    }

    const zip = new AdmZip();

    // Download each file and add to zip
    const downloadPromises = submissions.map(async (sub) => {
      try {
        const response = await axios.get(sub.fileUrl, { responseType: 'arraybuffer' });
        // Name the file: "StudentName_Submission.zip"
        const filename = `${sub.student.name.replace(/\s+/g, '_')}_submission.zip`;
        zip.addFile(filename, response.data);
      } catch (err) {
        console.error(`Failed to download for ${sub.student.name}:`, err.message);
      }
    });

    await Promise.all(downloadPromises);

    const zipBuffer = zip.toBuffer();

    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', `attachment; filename=All_Submissions.zip`);
    res.send(zipBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate zip' });
  }
};

module.exports = {
  postAssignment,
  getAssignments,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissions,
  getMySubmissions,
  downloadAllSubmissions
};