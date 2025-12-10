const User = require('../models/userModel');
const Class = require('../models/classModel');
const Score = require('../models/scoreModel');
const Attendance = require('../models/attendanceModel');
const Permit = require('../models/permitModel');
const Assignment = require('../models/assignmentModel');
const Submission = require('../models/submissionModel');
const Material = require('../models/materialModel');
const Announcement = require('../models/announcementModel');
const ScholarshipProgram = require('../models/scholarshipProgramModel');
const ScholarshipApplication = require('../models/scholarshipModel');
const FeeRelief = require('../models/feeReliefModel');
const Critique = require('../models/critiqueModel');
const Penalty = require('../models/penaltyModel');
const cloudinary = require('../config/cloudinary');
const { Parser } = require('json2csv');

// --- REPORT GENERATION ENGINE ---
const generateReport = async (req, res) => {
  const { type, academicYear } = req.body;

  try {
    let data = [];
    let fields = [];

    switch (type) {
      // 1. Student Report Cards
      case 'student_performance': 
        const students = await User.find({ role: 'student' }).lean();
        const scores = await Score.find({}).populate('class').lean();
        data = students.map(s => {
            const myScores = scores.filter(sc => sc.student.toString() === s._id.toString());
            const total = myScores.reduce((acc, curr) => acc + curr.value, 0);
            const avg = myScores.length ? (total / myScores.length).toFixed(2) : 0;
            return { Name: s.name, Email: s.email, Grade: s.gradeLevel, GPA: avg, Year: academicYear };
        });
        fields = ['Name', 'Email', 'Grade', 'GPA', 'Year'];
        break;

      // 2. At-Risk Students
      case 'at_risk': 
        const allStuds = await User.find({ role: 'student' }).lean();
        const allScores = await Score.find({}).lean();
        const allPens = await Penalty.find({}).lean();
        data = allStuds.map(s => {
             const myS = allScores.filter(sc => sc.student.toString() === s._id.toString());
             const avg = myS.length ? (myS.reduce((a,b)=>a+b.value,0)/myS.length) : 100;
             const penCount = allPens.filter(p => p.student.toString() === s._id.toString()).length;
             if (avg < 60 || penCount > 2) {
                 return { Name: s.name, Issue: avg < 60 ? 'Low Grades' : 'Behavior', Average: avg.toFixed(2), Penalties: penCount, Year: academicYear };
             }
             return null;
        }).filter(Boolean);
        fields = ['Name', 'Issue', 'Average', 'Penalties', 'Year'];
        break;

      // 3. Attendance Register
      case 'attendance': 
        const atts = await Attendance.find({}).populate('student', 'name').populate('class', 'name').lean();
        data = atts.map(a => ({
            Date: a.date ? a.date.toISOString().split('T')[0] : '-',
            Class: a.class?.name,
            Student: a.student?.name,
            Status: a.status,
            Year: academicYear
        }));
        fields = ['Date', 'Class', 'Student', 'Status', 'Year'];
        break;
        
      // 4. Assignment Completion
      case 'assignments': 
         const assigns = await Assignment.find({}).populate('class', 'name').lean();
         const subs = await Submission.find({}).lean();
         data = assigns.map(a => {
             const subCount = subs.filter(s => s.assignment.toString() === a._id.toString()).length;
             return { Assignment: a.title, Class: a.class?.name, Due: a.dueDate, Submissions: subCount, Year: academicYear };
         });
         fields = ['Assignment', 'Class', 'Due', 'Submissions', 'Year'];
         break;

      // 5. Teacher Activity
      case 'teacher_activity': 
         const teachers = await User.find({ role: 'teacher' }).lean();
         const tAssigns = await Assignment.find({}).lean();
         const tMats = await Material.find({}).lean();
         data = teachers.map(t => ({
             Teacher: t.name,
             Assignments: tAssigns.filter(a => a.teacher.toString() === t._id.toString()).length,
             Materials: tMats.filter(m => m.uploadedBy.toString() === t._id.toString()).length,
             Year: academicYear
         }));
         fields = ['Teacher', 'Assignments', 'Materials', 'Year'];
         break;

      // 6. Enrollment Stats
      case 'enrollment': 
         const classes = await Class.find({}).lean();
         data = classes.map(c => ({
             Class: c.name,
             Grade: c.gradeLevel,
             Students: c.students.length,
             Teacher: c.teacher || 'Unassigned',
             Year: academicYear
         }));
         fields = ['Class', 'Grade', 'Students', 'Teacher', 'Year'];
         break;

      // 7. Financial Aid
      case 'finance': 
         const scholarApps = await ScholarshipApplication.find({}).populate('student', 'name').lean();
         const reliefApps = await FeeRelief.find({}).populate('student', 'name').lean();
         const financeData = [
             ...scholarApps.map(s => ({ Type: 'Scholarship', Student: s.student?.name, Status: s.status, Date: s.createdAt })),
             ...reliefApps.map(f => ({ Type: 'Fee Relief', Student: f.student?.name, Status: f.status, Date: f.createdAt }))
         ];
         data = financeData.map(f => ({ ...f, Year: academicYear }));
         fields = ['Type', 'Student', 'Status', 'Date', 'Year'];
         break;

      // 8. Disciplinary
      case 'disciplinary': 
         const pens = await Penalty.find({}).populate('student', 'name').lean();
         data = pens.map(p => ({
             Student: p.student?.name,
             Violation: p.violationCategory,
             Severity: p.severityLevel,
             Date: p.incidentDate,
             Year: academicYear
         }));
         fields = ['Student', 'Violation', 'Severity', 'Date', 'Year'];
         break;
      
      // 9. Critique / Feedback
      case 'critique': 
         const crits = await Critique.find({}).populate('class', 'name').lean();
         data = crits.map(c => ({
             Class: c.class?.name,
             Feedback: c.message,
             Date: c.createdAt,
             Year: academicYear
         }));
         fields = ['Class', 'Feedback', 'Date', 'Year'];
         break;

      // 10. Announcement Reach
      case 'announcements': 
         const anns = await Announcement.find({}).lean();
         data = anns.map(a => ({
             Title: a.title,
             Views: a.views.length,
             Pinned: a.isPinned ? 'Yes' : 'No',
             Year: academicYear
         }));
         fields = ['Title', 'Views', 'Pinned', 'Year'];
         break;

      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename=${type}_${academicYear}.csv`);
    res.send(csv);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to generate report' });
  }
};

// --- SYSTEM RESET (NEW ACADEMIC YEAR) ---
const resetAcademicYear = async (req, res) => {
    try {
        console.log("Starting System Reset...");
        
        // 1. Delete all non-admin users
        await User.deleteMany({ role: { $ne: 'admin' } });
        
        // 2. Delete all Classes
        await Class.deleteMany({});

        // 3. Delete all data collections
        await Score.deleteMany({});
        await Attendance.deleteMany({});
        await Permit.deleteMany({});
        await Critique.deleteMany({});
        await Penalty.deleteMany({});
        
        // 4. Delete File-Heavy Collections
        // In a real app, you would loop through and delete from Cloudinary here too.
        // For now, we clear the database records.
        await Material.deleteMany({});
        await Assignment.deleteMany({});
        await Submission.deleteMany({});
        await Announcement.deleteMany({});
        
        // 5. Delete Scholarships
        await ScholarshipProgram.deleteMany({});
        await ScholarshipApplication.deleteMany({});
        await FeeRelief.deleteMany({});

        res.json({ message: 'System reset successful. Ready for new academic year.' });
    } catch (error) {
        console.error("Reset Failed:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { generateReport, resetAcademicYear };