const Score = require('../models/scoreModel');
const Class = require('../models/classModel');
const Critique = require('../models/critiqueModel');
const sendNotification = require('../utils/notification');

// @desc    Post (Add or Update) a Score
// @route   POST /api/scores
// @access  Private (Teacher/Admin)
const postScore = async (req, res) => {
  const { studentId, classId, type, value } = req.body;

  if (!studentId || !classId || !type || value === undefined) {
      return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // Upsert: Update if exists, Insert if new
    const score = await Score.findOneAndUpdate(
      { student: studentId, class: classId, type: type },
      { 
        value: value, 
        gradedBy: req.user._id 
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Notify Student
    await sendNotification([studentId], 'Score Updated', `A new score has been posted for ${type} in your class.`);

    res.json(score);
  } catch (error) {
    console.error("Post Score Error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Scores for a specific Class
// @route   GET /api/scores/class/:classId
// @access  Private (Teacher/Admin)
const getClassScores = async (req, res) => {
  try {
    const classId = req.params.classId;

    const classObj = await Class.findById(classId).populate('students', 'name email');
    if (!classObj) return res.status(404).json({ message: 'Class not found' });

    const scores = await Score.find({ class: classId });

    const scorebook = classObj.students.map(student => {
      const studentScores = scores.filter(s => s.student.toString() === student._id.toString());
      
      const scoreMap = {};
      studentScores.forEach(s => {
        scoreMap[s.type] = s.value; 
      });

      return {
        student: student,
        scores: scoreMap
      };
    });

    res.json(scorebook);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Scores for the logged-in Student (With Critique Check)
// @route   GET /api/scores/my-scores
// @access  Private (Student)
const getStudentScores = async (req, res) => {
  try {
    const scores = await Score.find({ student: req.user._id }).populate('class', 'name');
    
    // 1. Fetch all critiques by this student
    const critiques = await Critique.find({ student: req.user._id });
    // Create a Set of class IDs that have been critiqued for fast lookup
    const critiquedClassIds = new Set(critiques.map(c => c.class.toString()));

    const grouped = {};

    scores.forEach(s => {
      if (!s.class) return;
      
      const classId = s.class._id.toString();
      
      if (!grouped[classId]) {
        grouped[classId] = { 
            className: s.class.name, 
            classId: classId, // Needed for linking to Critique page
            scores: {},
            // 2. Check if this class is in the critiques list
            hasCritiqued: critiquedClassIds.has(classId) 
        };
      }
      grouped[classId].scores[s.type] = s.value;
    });

    res.json(Object.values(grouped));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  postScore,
  getClassScores,
  getStudentScores
};