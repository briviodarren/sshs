const admin = require('../config/firebase');
const User = require('../models/userModel');

// Send to specific User IDs
const sendNotification = async (userIds, title, body) => {
  try {
    if (!userIds || userIds.length === 0) return;

    // 1. Find users
    const users = await User.find({ _id: { $in: userIds } });
    
    // 2. Collect all their tokens
    let tokens = [];
    users.forEach(u => {
        if (u.fcmTokens && u.fcmTokens.length > 0) {
            tokens = [...tokens, ...u.fcmTokens];
        }
    });

    // 3. Remove duplicates
    const uniqueTokens = [...new Set(tokens)];
    if (uniqueTokens.length === 0) return;

    // 4. Send Multicast Message
    // Note: We use sendEachForMulticast which is the modern API replacement for sendMulticast
    const message = {
      notification: { title, body },
      tokens: uniqueTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`Notifications: ${response.successCount} sent, ${response.failureCount} failed.`);
    
    // Optional: Cleanup invalid tokens
    if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                failedTokens.push(uniqueTokens[idx]);
            }
        });
        // In a real app, you would remove these failedTokens from the database here
    }

  } catch (error) {
    console.error("FCM Notification Error:", error);
  }
};

module.exports = sendNotification;