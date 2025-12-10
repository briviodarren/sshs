const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to Database
connectDB();

// Initialize express app
const app = express();

// Middlewares
app.use(cors({
  origin: "*", // Allow all origins temporarily
  credentials: true
}));
app.use(express.json()); // Body parser for JSON
app.use(express.urlencoded({ extended: false })); // Body parser for URL encoded data

// Import Routes
const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const materialRoutes = require('./routes/materialsRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const permitRoutes = require('./routes/permitRoutes');
const financeRoutes = require('./routes/financeRoutes');
const behaviorRoutes = require('./routes/behaviorRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/permits', permitRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/behavior', behaviorRoutes);
app.use('/api/admin', adminRoutes);

// Simple test route
app.get('/', (req, res) => {
  res.send('SSHS Backend API is running...');
});

// Error Handling Middleware (Optional but recommended)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
module.exports = app; 