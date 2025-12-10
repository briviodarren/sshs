const ScholarshipProgram = require('../models/scholarshipProgramModel');
const ScholarshipApplication = require('../models/scholarshipModel');
const FeeRelief = require('../models/feeReliefModel');
const cloudinary = require('../config/cloudinary');
const AdmZip = require('adm-zip');

const bufferToDataURI = (fileFormat, buffer) => `data:${fileFormat};base64,${buffer.toString('base64')}`;

const uploadFile = async (file, folder) => {
  if (!file) return null;
  const dataUri = bufferToDataURI(file.mimetype, file.buffer);
  return await cloudinary.uploader.upload(dataUri, {
    resource_type: 'raw', folder: folder, type: 'upload', access_mode: 'public'
  });
};

// ... (Scholarship Functions: createProgram, getPrograms, updateProgram, deleteProgram, applyForScholarship, getApplications, updateApplicationStatus - KEEP THESE AS IS) ...
// (I will omit them here to save space, but make sure they stay in the file!)

// --- RE-PASTE SCHOLARSHIP FUNCTIONS HERE IF OVERWRITING THE WHOLE FILE ---
// (For safety, I will provide the FULL file content below)

// --- 1. SCHOLARSHIP PROGRAMS ---
const createProgram = async (req, res) => {
  try {
    if (new Date(req.body.closeDate) <= new Date(req.body.openDate)) return res.status(400).json({ message: "Close date must be AFTER Open date." });
    if (req.body.minScore < 0 || req.body.minScore > 100) return res.status(400).json({ message: "Score must be 0-100." });
    if (req.body.quota < 1) return res.status(400).json({ message: "Quota must be 1+." });
    const program = await ScholarshipProgram.create(req.body);
    res.status(201).json(program);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
const getPrograms = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
        query = { status: 'Active', openDate: { $lte: new Date() }, closeDate: { $gte: new Date() } };
    }
    const programs = await ScholarshipProgram.find(query).sort({ createdAt: -1 });
    res.json(programs);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
const updateProgram = async (req, res) => {
    try {
        if (req.body.openDate && req.body.closeDate && new Date(req.body.closeDate) <= new Date(req.body.openDate)) return res.status(400).json({ message: "Close date error." });
        const program = await ScholarshipProgram.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(program);
    } catch (e) { res.status(500).json({ message: e.message }); }
};
const deleteProgram = async (req, res) => {
    try {
        const applications = await ScholarshipApplication.find({ program: req.params.id });
        for (const app of applications) {
            if (app.cloudinaryPublicId) { try { await cloudinary.uploader.destroy(app.cloudinaryPublicId, { resource_type: 'raw' }); } catch(e){} }
        }
        await ScholarshipApplication.deleteMany({ program: req.params.id });
        await ScholarshipProgram.findByIdAndDelete(req.params.id);
        res.json({ message: "Program deleted" });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// --- 2. SCHOLARSHIP APPLICATIONS ---
const applyForScholarship = async (req, res) => {
  try {
    const { programId, averageScore, gradeLevel, ...otherData } = req.body;
    const program = await ScholarshipProgram.findById(programId);
    if (!program) return res.status(404).json({ message: 'Program not found' });
    if (Number(averageScore) < program.minScore) return res.status(400).json({ message: `Score too low.` });

    const zip = new AdmZip();
    const files = req.files;
    if (files['identityDoc']) zip.addFile(`Identity_${files['identityDoc'][0].originalname}`, files['identityDoc'][0].buffer);
    if (files['proofDoc']) zip.addFile(`Proof_${files['proofDoc'][0].originalname}`, files['proofDoc'][0].buffer);
    if (files['achievementDoc']) zip.addFile(`Certificate_${files['achievementDoc'][0].originalname}`, files['achievementDoc'][0].buffer);
    
    const result = await cloudinary.uploader.upload(bufferToDataURI('application/zip', zip.toBuffer()), {
        resource_type: 'raw', folder: 'sshs/scholarships', format: 'zip', type: 'upload', access_mode: 'public'
    });

    const application = await ScholarshipApplication.create({
      student: req.user._id, program: programId, averageScore: Number(averageScore), gradeLevel: Number(gradeLevel), ...otherData,
      fileUrl: result.secure_url, cloudinaryPublicId: result.public_id, dataAccuracyConfirmed: true, parentConsent: true
    });
    await ScholarshipProgram.findByIdAndUpdate(programId, { $inc: { applicantsCount: 1 } });
    res.status(201).json(application);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
const getApplications = async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'student') query = { student: req.user._id };
        const apps = await ScholarshipApplication.find(query).populate('student', 'name email').populate('program', 'title category minScore quota awardedCount').sort({ createdAt: -1 });
        res.json(apps);
    } catch (e) { res.status(500).json({ message: e.message }); }
};
const updateApplicationStatus = async (req, res) => {
    try {
        const app = await ScholarshipApplication.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        if (req.body.status === 'Awarded') await ScholarshipProgram.findByIdAndUpdate(app.program, { $inc: { awardedCount: 1 } });
        res.json(app);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// --- 3. FEE RELIEF (UPDATED) ---

const applyFeeRelief = async (req, res) => {
    try {
        const { reliefType, hardshipCategory, employmentStatus, incomeRange, dependents, paymentCondition, parentConsent, truthDeclaration } = req.body;
        if (!truthDeclaration || truthDeclaration === 'false') return res.status(400).json({ message: 'Declaration required.' });

        const zip = new AdmZip();
        const files = req.files;
        let hasFiles = false;
        if (files) {
            ['incomeDoc', 'terminationDoc', 'medicalDoc', 'assistanceDoc', 'disasterDoc'].forEach(key => {
                if (files[key]) { zip.addFile(`${key}_${files[key][0].originalname}`, files[key][0].buffer); hasFiles = true; }
            });
        }
        if (!hasFiles) return res.status(400).json({ message: 'Proof required.' });

        const result = await cloudinary.uploader.upload(bufferToDataURI('application/zip', zip.toBuffer()), {
            resource_type: 'raw', folder: 'sshs/fee_relief', format: 'zip', type: 'upload', access_mode: 'public'
        });

        const app = await FeeRelief.create({
            student: req.user._id, reliefType, hardshipCategory, employmentStatus, incomeRange,
            dependents: Number(dependents), paymentCondition, parentConsent: parentConsent==='true', truthDeclaration: truthDeclaration==='true',
            fileUrl: result.secure_url, cloudinaryPublicId: result.public_id
        });
        res.status(201).json(app);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

const getFeeReliefs = async (req, res) => {
    const query = req.user.role === 'student' ? { student: req.user._id } : {};
    const apps = await FeeRelief.find(query).populate('student', 'name').sort({ createdAt: -1 });
    res.json(apps);
};

const updateFeeReliefStatus = async (req, res) => {
    const app = await FeeRelief.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(app);
};

// NEW: Update Fee Relief (Edit)
const updateFeeRelief = async (req, res) => {
    try {
        // We only allow editing text fields, not re-uploading files for simplicity in this update
        const app = await FeeRelief.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(app);
    } catch (e) { res.status(500).json({ message: e.message }); }
};

// NEW: Delete Fee Relief
const deleteFeeRelief = async (req, res) => {
    try {
        const app = await FeeRelief.findById(req.params.id);
        if (app.cloudinaryPublicId) {
            try { await cloudinary.uploader.destroy(app.cloudinaryPublicId, { resource_type: 'raw' }); } catch(e){}
        }
        await app.deleteOne();
        res.json({ message: "Deleted" });
    } catch (e) { res.status(500).json({ message: e.message }); }
};

module.exports = {
  createProgram, getPrograms, updateProgram, deleteProgram,
  applyForScholarship, getApplications, updateApplicationStatus,
  applyFeeRelief, getFeeReliefs, updateFeeReliefStatus, updateFeeRelief, deleteFeeRelief
};