const multer = require('multer');

// Configure Multer to use memory storage
const storage = multer.memoryStorage();

// Set up file filter 
// We can customize this later to accept only specific file types
const fileFilter = (req, file, cb) => {
  // For now, accept all files
  cb(null, true); 
};

// Initialize multer
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB file size limit
});

module.exports = upload;