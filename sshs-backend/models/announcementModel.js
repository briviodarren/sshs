const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pdfUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    
    // Tracks if the announcement is pinned to the top
    isPinned: { type: Boolean, default: false },
    
    // Tracks which users have viewed this announcement
    views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

const Announcement = mongoose.model('Announcement', announcementSchema);
module.exports = Announcement;