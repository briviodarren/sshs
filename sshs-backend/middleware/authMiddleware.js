const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
require('dotenv').config();

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to check for 'teacher' role
const teacher = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a teacher' });
  }
};

// Middleware to check for 'admin' role
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

// Middleware to check for 'teacher' OR 'admin' role
const teacherOrAdmin = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === 'teacher' || req.user.role === 'admin')
  ) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a teacher or admin' });
  }
};

module.exports = { protect, teacher, admin, teacherOrAdmin };