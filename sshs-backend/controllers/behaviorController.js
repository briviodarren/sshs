const Critique = require('../models/critiqueModel');
const Penalty = require('../models/penaltyModel');
const User = require('../models/userModel');
const cloudinary = require('../config/cloudinary');
const sendNotification = require('../utils/notification');

// Helper
const bufferToDataURI = (fileFormat, buffer) => `data:${fileFormat};base64,${buffer.toString('base64')}`;

// --- CRITIQUES ---

// @desc Create Critique (Student)
const createCritique = async (req, res) => {
  const { classId, message } = req.body;
  if (!classId || !message) return res.status(400).json({ message: 'Class and message required' });

  try {
    const critique = await Critique.create({
      student: req.user._id,
      class: classId,
      message
    });
    res.status(201).json(critique);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc Get All Critiques (Admin)
const getAllCritiques = async (req, res) => {
  try {
    const critiques = await Critique.find({})
      .populate('student', 'name email')
      // FIX: Added 'gradeLevel' to population for filtering
      .populate('class', 'name gradeLevel') 
      .sort({ createdAt: -1 });
    res.json(critiques);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc Get My Critiques (Student)
const getMyCritiques = async (req, res) => {
  try {
    const critiques = await Critique.find({ student: req.user._id })
      .populate('class', 'name gradeLevel') 
      .sort({ createdAt: -1 });
    res.json(critiques);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// --- PENALTIES ---

// @desc Assign Penalty (Teacher/Admin)
const assignPenalty = async (req, res) => {
  try {
    const { 
        studentId, violationCategory, severityLevel, incidentDate, 
        issuingAuthorityType, assignedPunishment, executionStatus, 
        overrideAuthority, overrideReason, status 
    } = req.body;

    if (!studentId || !violationCategory) return res.status(400).json({ message: 'Student and Violation Category are required.' });

    let fileData = {};
    if (req.file) {
        try {
            const dataUri = bufferToDataURI(req.file.mimetype, req.file.buffer);
            const result = await cloudinary.uploader.upload(dataUri, {
                resource_type: 'raw', folder: 'sshs/penalties', type: 'upload', access_mode: 'public'
            });
            fileData = { evidenceUrl: result.secure_url, cloudinaryPublicId: result.public_id };
        } catch (error) { return res.status(500).json({ message: 'Evidence upload failed' }); }
    }

    const penalty = await Penalty.create({
      student: studentId,
      issuedBy: req.user._id,
      violationCategory, severityLevel, incidentDate, issuingAuthorityType,
      assignedPunishment, executionStatus, overrideAuthority,
      overrideReason: overrideAuthority === 'No Override' ? null : overrideReason,
      // Removed studentAcknowledgement as requested
      status: status || 'Active',
      ...fileData
    });

    await penalty.populate('student', 'name');

    // Notify Student
    await sendNotification([studentId], 'Disciplinary Notice', `You have received a new penalty: ${violationCategory}`);

    res.status(201).json(penalty);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc Update Penalty
const updatePenalty = async (req, res) => {
    try {
        const penalty = await Penalty.findById(req.params.id);
        if(!penalty) return res.status(404).json({ message: "Penalty not found" });

        // Edit Permission: Admin OR the Teacher who issued it
        if (req.user.role !== 'admin' && penalty.issuedBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized to edit this penalty" });
        }

        const fields = ['studentId', 'violationCategory', 'severityLevel', 'incidentDate', 'issuingAuthorityType', 'assignedPunishment', 'executionStatus', 'overrideAuthority', 'overrideReason', 'status'];
        fields.forEach(field => {
            if (req.body[field]) {
                if (field === 'studentId') penalty.student = req.body[field];
                else penalty[field] = req.body[field];
            }
        });

        if (req.file) {
            if (penalty.cloudinaryPublicId) {
                try { await cloudinary.uploader.destroy(penalty.cloudinaryPublicId, { resource_type: 'raw' }); } catch(e){}
            }
            const dataUri = bufferToDataURI(req.file.mimetype, req.file.buffer);
            const result = await cloudinary.uploader.upload(dataUri, {
                resource_type: 'raw', folder: 'sshs/penalties', type: 'upload', access_mode: 'public'
            });
            penalty.evidenceUrl = result.secure_url;
            penalty.cloudinaryPublicId = result.public_id;
        }

        await penalty.save();
        await penalty.populate('student', 'name');
        res.json(penalty);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc Delete Penalty
const deletePenalty = async (req, res) => {
    try {
        const penalty = await Penalty.findById(req.params.id);
        if(!penalty) return res.status(404).json({ message: "Penalty not found" });

        // Delete Permission: Admin OR the Teacher who issued it
        if (req.user.role !== 'admin' && penalty.issuedBy.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: "Not authorized to delete this penalty" });
        }

        if (penalty.cloudinaryPublicId) {
            try { await cloudinary.uploader.destroy(penalty.cloudinaryPublicId, { resource_type: 'raw' }); } catch(e){}
        }

        await penalty.deleteOne();
        res.json({ message: "Penalty deleted" });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// @desc Get Penalties
const getPenalties = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') query = { student: req.user._id };
    
    const penalties = await Penalty.find(query)
      .populate('student', 'name')
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(penalties);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = {
  createCritique, getAllCritiques, getMyCritiques,
  assignPenalty, updatePenalty, deletePenalty, getPenalties
};