const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');
const connectDB = require('./config/db');

dotenv.config();

const users = [
  {
    name: 'Admin User',
    email: 'admin@sshs.edu',
    password: 'password123',
    role: 'admin',
    address: '123 School St',
  },
  {
    name: 'Teacher User',
    email: 'teacher@sshs.edu',
    password: 'password123',
    role: 'teacher',
    address: '456 Faculty Ave',
  },
  {
    name: 'Student User',
    email: 'student@sshs.edu',
    password: 'password123',
    role: 'student',
    address: '789 Dormitory Ln',
  },
];

const importData = async () => {
  try {
    // Connect to DB
    await connectDB();

    // Clear existing users
    await User.deleteMany();

    // -- THIS IS THE FIX --
    // We use User.create() in a loop instead of User.insertMany()
    // This ensures the 'pre-save' hook in userModel.js runs and hashes the password.
    for (const userData of users) {
      await User.create(userData);
    }
    // -------------------

    console.log('Dummy data imported successfully! (Passwords hashed)');
    process.exit();
  } catch (error) {
    console.error(`Error with data import: ${error}`);
    process.exit(1);
  }
};

// Check for command-line argument
if (process.argv[2] === '-d') {
  // You can add a destroyData function here if needed
} else {
  importData();
}