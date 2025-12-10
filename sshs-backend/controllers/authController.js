const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const stream = require('stream');
require('dotenv').config();

// --- IMPORTS FOR CASCADE DELETE & AUTO ENROLLMENT ---
const Class = require('../models/classModel');
const Submission = require('../models/submissionModel');
const Score = require('../models/scoreModel');
const Attendance = require('../models/attendanceModel');
const Permit = require('../models/permitModel');
const Material = require('../models/materialModel');
const Assignment = require('../models/assignmentModel');
const Announcement = require('../models/announcementModel');
const Critique = require('../models/critiqueModel');
const Penalty = require('../models/penaltyModel');
const ScholarshipApplication = require('../models/scholarshipModel');
const FeeRelief = require('../models/feeReliefModel');
const cloudinary = require('../config/cloudinary');
// ----------------------------------

const generateToken = (id, rememberMe) => {
  const expiresIn = rememberMe ? '30d' : '1d';
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn });
};

// --- HELPER: AUTO-ENROLL STUDENT ---
// Finds relevant classes and enrolls the student immediately
const autoEnrollStudent = async (student) => {
    if (student.role !== 'student' || !student.gradeLevel) return;

    try {
        // Find classes that match Grade AND (Mandatory OR Matching Major)
        const classesToEnroll = await Class.find({
            gradeLevel: student.gradeLevel,
            $or: [
                { category: 'Mandatory' },
                { category: student.major } // Matches 'Science' or 'Social'
            ]
        });

        if (classesToEnroll.length > 0) {
            const classIds = classesToEnroll.map(c => c._id);

            // 1. Add Classes to Student
            await User.findByIdAndUpdate(student._id, {
                $addToSet: { classes: { $each: classIds } }
            });

            // 2. Add Student to Classes
            await Class.updateMany(
                { _id: { $in: classIds } },
                { $addToSet: { students: student._id } }
            );
            
            console.log(`Auto-enrolled ${student.name} into ${classesToEnroll.length} classes.`);
        }
    } catch (error) {
        console.error("Auto-enrollment failed:", error.message);
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  const { name, email, password, role, address, gradeLevel, major } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({
      name,
      email,
      password,
      role,
      address,
      gradeLevel: role === 'student' ? gradeLevel : undefined,
      major: role === 'student' ? (major || 'None') : 'None',
    });

    // --- TRIGGER AUTO ENROLLMENT ---
    if (user.role === 'student') {
        await autoEnrollStudent(user);
    }

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, false),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Import Users from CSV
// @route   POST /api/auth/import
// @access  Private (Admin)
const importUsers = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No CSV file uploaded' });

  const results = [];
  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.file.buffer);

  bufferStream
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        let count = 0;
        let errors = 0;

        for (const row of results) {
            const name = row.name || row.Name;
            const email = row.email || row.Email;
            const password = row.password || row.Password || 'password123';
            const role = (row.role || row.Role || 'student').toLowerCase();
            const address = row.address || row.Address || '';
            const gradeLevel = row.gradeLevel || row.GradeLevel;
            const major = row.major || row.Major || 'None';

            if (!name || !email) {
                errors++;
                continue;
            }

            const userExists = await User.findOne({ email });
            if (!userExists) {
                const newUser = await User.create({
                    name, email, password, role, address,
                    gradeLevel: role === 'student' ? gradeLevel : undefined,
                    major: role === 'student' ? major : 'None'
                });
                
                // --- TRIGGER AUTO ENROLLMENT FOR EACH ROW ---
                if (newUser.role === 'student') {
                    await autoEnrollStudent(newUser);
                }

                count++;
            } else {
                errors++;
            }
        }

        res.json({ message: `Import finished. ${count} users created. ${errors} skipped.` });
      } catch (error) {
        console.error("CSV Import Error:", error);
        res.status(500).json({ message: 'Failed to process CSV file' });
      }
    });
};

// @desc    Auth user & get token (Login)
const loginUser = async (req, res) => {
  const { email, password, rememberMe } = req.body;
  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        gradeLevel: user.gradeLevel,
        token: generateToken(user._id, rememberMe),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile (Self)
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.address = req.body.address || user.address;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      address: updatedUser.address,
      gradeLevel: updatedUser.gradeLevel,
      token: req.headers.authorization.split(' ')[1],
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Get users by role
const getUsersByRole = async (req, res) => {
  try {
    const users = await User.find({ role: req.params.role }).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update any user by ID (Admin)
const updateUserByAdmin = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    if (user.role === 'admin') {
        return res.status(403).json({ message: 'Cannot edit other admins.' });
    }

    // Store old values to check for changes
    const oldGrade = user.gradeLevel;
    const oldMajor = user.major;

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.address = req.body.address || user.address;
    
    if (user.role === 'student') {
        if(req.body.gradeLevel) user.gradeLevel = req.body.gradeLevel;
        if(req.body.major) user.major = req.body.major;
    }
    
    if (req.body.password && req.body.password.trim() !== '') {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    // --- RE-TRIGGER ENROLLMENT IF GRADE/MAJOR CHANGED ---
    if (user.role === 'student' && (oldGrade !== updatedUser.gradeLevel || oldMajor !== updatedUser.major)) {
        await autoEnrollStudent(updatedUser);
    }

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      address: updatedUser.address,
      gradeLevel: updatedUser.gradeLevel,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Delete user (Cascade Delete)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete an Admin account' });
    }

    console.log(`Starting cascade delete for User: ${user.name} (${user.role})`);

    // --- CASE 1: DELETING A STUDENT ---
    if (user.role === 'student') {
      await Class.updateMany({ students: user._id }, { $pull: { students: user._id } });
      
      // Submissions
      const submissions = await Submission.find({ student: user._id });
      // (Optional: Delete Cloudinary files for submissions if tracked)
      await Submission.deleteMany({ student: user._id });

      // Permits
      const permits = await Permit.find({ student: user._id });
      for (const p of permits) {
        if (p.cloudinaryPublicId) {
          try { await cloudinary.uploader.destroy(p.cloudinaryPublicId, { resource_type: 'raw' }); } catch(e){}
        }
      }
      await Permit.deleteMany({ student: user._id });

      // Other data
      await Score.deleteMany({ student: user._id });
      await Attendance.deleteMany({ student: user._id });
      await Critique.deleteMany({ student: user._id });
      await Penalty.deleteMany({ student: user._id });
      await ScholarshipApplication.deleteMany({ student: user._id }); // Also clean applications
      await FeeRelief.deleteMany({ student: user._id });
    }

    // --- CASE 2: DELETING A TEACHER ---
    if (user.role === 'teacher') {
      await Class.updateMany({ teacher: user._id }, { $unset: { teacher: "" } });

      // Materials
      const materials = await Material.find({ uploadedBy: user._id });
      for (const m of materials) {
        if (m.cloudinaryPublicId) {
          try {
            await cloudinary.uploader.destroy(m.cloudinaryPublicId, { resource_type: 'raw' });
            await cloudinary.uploader.destroy(m.cloudinaryPublicId, { resource_type: 'video' });
            await cloudinary.uploader.destroy(m.cloudinaryPublicId);
          } catch(e){}
        }
      }
      await Material.deleteMany({ uploadedBy: user._id });

      // Announcements
      const announcements = await Announcement.find({ postedBy: user._id });
      for (const a of announcements) {
        if (a.cloudinaryPublicId) {
          try { await cloudinary.uploader.destroy(a.cloudinaryPublicId, { resource_type: 'raw' }); } catch(e){}
        }
      }
      await Announcement.deleteMany({ postedBy: user._id });

      // Assignments
      const assignments = await Assignment.find({ teacher: user._id });
      for (const assign of assignments) {
        if (assign.cloudinaryPublicId) {
          try { await cloudinary.uploader.destroy(assign.cloudinaryPublicId, { resource_type: 'raw' }); } catch(e){}
        }
        await Submission.deleteMany({ assignment: assign._id });
      }
      await Assignment.deleteMany({ teacher: user._id });
    }

    await user.deleteOne();
    res.json({ message: 'User and all related data deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Save FCM Token
// @route   PUT /api/auth/fcm-token
const saveFcmToken = async (req, res) => {
    const { token } = req.body;
    try {
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { fcmTokens: token }
        });
        res.json({ message: 'Token saved' });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = { 
    registerUser, loginUser, updateUserProfile, getUsersByRole, 
    updateUserByAdmin, deleteUser, importUsers, saveFcmToken 
};