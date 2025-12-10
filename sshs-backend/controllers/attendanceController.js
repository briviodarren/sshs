const Attendance = require('../models/attendanceModel');
const Class = require('../models/classModel');

// Helper: Strip time to ensure unique daily records (Midnight UTC)
// This fixes the "Duplicate Entry" bug by treating all times on the same day as the same record.
const normalizeDate = (d) => {
  const date = new Date(d);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// @desc    Mark Attendance (Bulk Upsert)
// @route   POST /api/attendance
// @access  Private (Teacher/Admin)
const markAttendance = async (req, res) => {
  const { classId, date, students } = req.body; // students = [{ studentId, status }]

  try {
    const normalizedDate = normalizeDate(date); // Ensure standardized date

    // Loop through list and update/insert individually
    const promises = students.map(s => {
      return Attendance.findOneAndUpdate(
        { 
          student: s.studentId, 
          class: classId, 
          date: normalizedDate 
        },
        { status: s.status },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    });

    await Promise.all(promises);
    res.json({ message: 'Attendance saved successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Attendance for a Class on a Date
// @route   GET /api/attendance/class/:classId/:date
// @access  Private (Teacher/Admin)
const getClassAttendance = async (req, res) => {
  try {
    const { classId, date } = req.params;
    const normalizedDate = normalizeDate(date);

    // Find records matching date and class
    const attendance = await Attendance.find({ 
      class: classId, 
      date: normalizedDate 
    });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get My Attendance Stats (Detailed)
// @route   GET /api/attendance/my-stats
// @access  Private (Student)
const getStudentAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ student: req.user._id })
      .populate('class', 'name')
      .sort({ date: -1 }); // Newest dates first
    
    // Group by class
    const stats = {};
    
    records.forEach(record => {
      // Handle case where class might have been deleted
      const className = record.class?.name || 'Unknown Class';
      
      if (!stats[className]) {
        stats[className] = { 
          present: 0, late: 0, absent: 0, excused: 0, total: 0,
          history: [] // Store history for the "View History" dropdown
        };
      }
      
      stats[className].total++;
      
      // Increment counts
      if (record.status === 'Present') stats[className].present++;
      else if (record.status === 'Late') stats[className].late++;
      else if (record.status === 'Absent') stats[className].absent++;
      else if (record.status === 'Excused') stats[className].excused++;

      // Add to history list
      stats[className].history.push({
        date: record.date,
        status: record.status
      });
    });

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  markAttendance, 
  getClassAttendance, 
  getStudentAttendance 
};