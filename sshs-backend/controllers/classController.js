const Class = require('../models/classModel');
const User = require('../models/userModel');
const Material = require('../models/materialModel');
const Assignment = require('../models/assignmentModel');
const Submission = require('../models/submissionModel');
const Score = require('../models/scoreModel');
const Attendance = require('../models/attendanceModel');
const Permit = require('../models/permitModel');
const cloudinary = require('../config/cloudinary');
const csv = require('csv-parser');
const stream = require('stream');

// Helper: Convert "HH:MM" to minutes for easy comparison
const getMinutes = (timeStr) => {
  if(!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Helper: Check if two time ranges overlap
const isTimeOverlap = (start1, end1, start2, end2) => {
  const s1 = getMinutes(start1);
  const e1 = getMinutes(end1);
  const s2 = getMinutes(start2);
  const e2 = getMinutes(end2);
  return Math.max(s1, s2) < Math.min(e1, e2);
};

// @desc    Create a new class (With Overlap Validation & Auto-Enroll)
// @route   POST /api/classes
// @access  Private (Admin)
const createClass = async (req, res) => {
  const { name, gradeLevel, day, startTime, endTime, category, teacherId } = req.body;
  
  if (!gradeLevel || !day || !startTime || !endTime || !category) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Time Validation
  if (getMinutes(startTime) >= getMinutes(endTime)) {
    return res.status(400).json({ message: 'End time must be after Start time' });
  }

  try {
    const existingClasses = await Class.find({ gradeLevel, day });

    // Conflict Check
    for (const cls of existingClasses) {
      if (isTimeOverlap(startTime, endTime, cls.startTime, cls.endTime)) {
        // 1. Mandatory clashes with everything
        if (category === 'Mandatory') {
           return res.status(400).json({ message: `Conflict! Mandatory class cannot overlap with '${cls.name}'` });
        }
        // 2. Existing Mandatory clashes with everything
        if (cls.category === 'Mandatory') {
           return res.status(400).json({ message: `Conflict! Cannot overlap with Mandatory class '${cls.name}'` });
        }
        // 3. Science vs Science
        if (category === 'Science' && cls.category === 'Science') {
           return res.status(400).json({ message: `Conflict! Science class cannot overlap with '${cls.name}'` });
        }
        // 4. Social vs Social
        if (category === 'Social' && cls.category === 'Social') {
           return res.status(400).json({ message: `Conflict! Social class cannot overlap with '${cls.name}'` });
        }
      }
    }

    const newClass = await Class.create({ 
      name, gradeLevel, day, startTime, endTime, category,
      teacher: teacherId || undefined
    });

    // If teacher assigned, update their profile
    if (teacherId) {
        await User.findByIdAndUpdate(teacherId, { $addToSet: { classes: newClass._id } });
    }

    // --- AUTO ENROLLMENT ---
    let query = { role: 'student', gradeLevel: gradeLevel };
    
    if (category === 'Science') {
        query.major = 'Science';
    } else if (category === 'Social') {
        query.major = 'Social';
    }
    // If 'Mandatory', it selects all students in that grade (default query)
    
    const studentsToEnroll = await User.find(query);
    const studentIds = studentsToEnroll.map(s => s._id);

    if (studentIds.length > 0) {
        newClass.students = studentIds;
        await newClass.save();
        await User.updateMany(
            { _id: { $in: studentIds } }, 
            { $addToSet: { classes: newClass._id } }
        );
    }

    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Import Classes from CSV
// @route   POST /api/classes/import
// @access  Private (Admin)
const importClasses = async (req, res) => {
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
            // CSV Headers: name, gradeLevel, day, startTime, endTime, category, teacherEmail
            const name = row.name || row.Name;
            const gradeLevel = row.gradeLevel || row.GradeLevel;
            const day = row.day || row.Day;
            const startTime = row.startTime || row.StartTime;
            const endTime = row.endTime || row.EndTime;
            const category = row.category || row.Category || 'Mandatory';
            const teacherEmail = row.teacherEmail || row.TeacherEmail;

            if (!name || !gradeLevel || !day || !startTime || !endTime) {
                console.log("Skipping invalid row:", row);
                errors++; continue;
            }

            // 1. Find Teacher by Email
            let teacherId = undefined;
            if (teacherEmail) {
                const teacher = await User.findOne({ email: teacherEmail, role: 'teacher' });
                if (teacher) teacherId = teacher._id;
            }

            // 2. Check Overlaps (Simplified: skips row if overlap)
            const existingClasses = await Class.find({ gradeLevel, day });
            let hasConflict = false;
            for (const cls of existingClasses) {
                if (isTimeOverlap(startTime, endTime, cls.startTime, cls.endTime)) {
                    if (category === 'Mandatory' || cls.category === 'Mandatory' || (category === cls.category)) {
                        hasConflict = true; break;
                    }
                }
            }
            if (hasConflict) { 
                console.log(`Skipping overlap: ${name}`);
                errors++; continue; 
            }

            // 3. Create Class
            const newClass = await Class.create({
                name, gradeLevel, day, startTime, endTime, category, teacher: teacherId
            });

            // 4. Assign Teacher
            if (teacherId) {
                await User.findByIdAndUpdate(teacherId, { $addToSet: { classes: newClass._id } });
            }

            // 5. Auto Enroll Students
            let query = { role: 'student', gradeLevel: gradeLevel };
            if (category === 'Science') query.major = 'Science';
            else if (category === 'Social') query.major = 'Social';
            
            const studentsToEnroll = await User.find(query);
            const studentIds = studentsToEnroll.map(s => s._id);

            if (studentIds.length > 0) {
                newClass.students = studentIds;
                await newClass.save();
                await User.updateMany({ _id: { $in: studentIds } }, { $addToSet: { classes: newClass._id } });
            }

            count++;
        }

        res.json({ message: `Import finished. ${count} classes created. ${errors} skipped (conflicts/invalid).` });
      } catch (error) {
        console.error("CSV Import Error:", error);
        res.status(500).json({ message: 'Failed to process CSV file' });
      }
    });
};

// @desc    Update class details
// @route   PUT /api/classes/:id
// @access  Private (Admin)
const updateClass = async (req, res) => {
  const { name, teacherId, gradeLevel, day, startTime, endTime, category } = req.body;
  try {
    const classToUpdate = await Class.findById(req.params.id);
    if (!classToUpdate) return res.status(404).json({ message: 'Class not found' });

    // Time Validation
    const newStart = startTime || classToUpdate.startTime;
    const newEnd = endTime || classToUpdate.endTime;
    if (getMinutes(newStart) >= getMinutes(newEnd)) return res.status(400).json({ message: 'End time must be after Start' });

    // Update Fields
    if (name) classToUpdate.name = name;
    if (gradeLevel) classToUpdate.gradeLevel = gradeLevel;
    if (day) classToUpdate.day = day;
    if (startTime) classToUpdate.startTime = startTime;
    if (endTime) classToUpdate.endTime = endTime;
    if (category) classToUpdate.category = category;

    if (teacherId && teacherId !== classToUpdate.teacher?.toString()) {
      if (classToUpdate.teacher) {
        await User.findByIdAndUpdate(classToUpdate.teacher, { $pull: { classes: classToUpdate._id } });
      }
      await User.findByIdAndUpdate(teacherId, { $addToSet: { classes: classToUpdate._id } });
      classToUpdate.teacher = teacherId;
    }

    await classToUpdate.save();
    res.json(classToUpdate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private
const getAllClasses = async (req, res) => {
    try {
      const classes = await Class.find({})
        .populate('teacher', 'name email')
        .populate('students', 'name email');
      res.json(classes);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Assign a student to a class
// @route   PUT /api/classes/assign-student
// @access  Private (Admin)
const assignStudentToClass = async (req, res) => {
    const { studentId, classId } = req.body;
    try {
      const classObj = await Class.findById(classId);
      const student = await User.findById(studentId);
  
      if (!classObj || !student) {
        return res.status(404).json({ message: 'Class or Student not found' });
      }
  
      // Validate Grade Level Match
      if (student.gradeLevel !== classObj.gradeLevel) {
        return res.status(400).json({ 
          message: `Cannot enroll. Student is Grade ${student.gradeLevel}, but Class is Grade ${classObj.gradeLevel}.` 
        });
      }
  
      await Class.findByIdAndUpdate(classId, { $addToSet: { students: studentId } });
      await User.findByIdAndUpdate(studentId, { $addToSet: { classes: classId } });
      res.json({ message: 'Student assigned successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Assign a teacher to a class
// @route   PUT /api/classes/assign-teacher
// @access  Private (Admin)
const assignTeacherToClass = async (req, res) => {
    const { teacherId, classId } = req.body;
    try {
      const updatedClass = await Class.findByIdAndUpdate(classId, { teacher: teacherId }, { new: true });
      await User.findByIdAndUpdate(teacherId, { $addToSet: { classes: classId } });
      res.json(updatedClass);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Remove a student from a class
// @route   PUT /api/classes/remove-student
// @access  Private (Admin)
const removeStudentFromClass = async (req, res) => {
    const { classId, studentId } = req.body;
    try {
      await Class.findByIdAndUpdate(classId, { $pull: { students: studentId } });
      await User.findByIdAndUpdate(studentId, { $pull: { classes: classId } });
      res.json({ message: 'Student removed' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// @desc    Delete a class (Cascade Delete)
// @route   DELETE /api/classes/:id
// @access  Private (Admin)
const deleteClass = async (req, res) => {
    try {
      const classId = req.params.id;
      const classToDelete = await Class.findById(classId);
      
      if (!classToDelete) { return res.status(404).json({ message: 'Class not found' }); }
  
      console.log(`Starting cascade delete for Class: ${classToDelete.name}`);

      // 1. Delete Materials (Files + Records)
      const materials = await Material.find({ class: classId });
      for (const material of materials) {
        if (material.cloudinaryPublicId) {
          try {
            await cloudinary.uploader.destroy(material.cloudinaryPublicId, { resource_type: 'raw' });
            await cloudinary.uploader.destroy(material.cloudinaryPublicId, { resource_type: 'video' });
            await cloudinary.uploader.destroy(material.cloudinaryPublicId);
          } catch (err) { }
        }
      }
      await Material.deleteMany({ class: classId });
  
      // 2. Delete Assignments & Submissions
      const assignments = await Assignment.find({ class: classId });
      for (const assignment of assignments) {
        if (assignment.cloudinaryPublicId) {
          try { await cloudinary.uploader.destroy(assignment.cloudinaryPublicId, { resource_type: 'raw' }); } catch (err) { }
        }
        await Submission.deleteMany({ assignment: assignment._id });
      }
      await Assignment.deleteMany({ class: classId });
  
      // 3. Delete Scores
      await Score.deleteMany({ class: classId });
  
      // 4. Delete Attendance & Permits
      await Attendance.deleteMany({ class: classId });
      await Permit.deleteMany({ class: classId });
  
      // 5. Unassign Users (Teacher & Students)
      if (classToDelete.teacher) {
        await User.findByIdAndUpdate(classToDelete.teacher, { $pull: { classes: classId } });
      }
      await User.updateMany({ classes: classId }, { $pull: { classes: classId } });
  
      await classToDelete.deleteOne();
      res.json({ message: 'Class and all related data deleted successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

module.exports = {
  createClass,
  getAllClasses,
  assignStudentToClass,
  assignTeacherToClass,
  updateClass,
  deleteClass,
  removeStudentFromClass,
  importClasses
};