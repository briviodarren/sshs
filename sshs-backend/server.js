// sshs-backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to Database (runs once per cold start in Vercel)
connectDB();

// Initialize express app
const app = express();

// Middlewares
const allowedOrigins = [
  "http://localhost:5173",          // Vite dev
  "https://sshs-vert.vercel.app",   // Frontend di Vercel
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (e.g. mobile apps, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Optional: log blocked origin
      console.warn("CORS blocked origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
  })
);

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

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Export app for Vercel serverless
module.exports = app;
