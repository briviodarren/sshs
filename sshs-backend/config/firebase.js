// sshs-backend/config/firebase.js
const admin = require('firebase-admin');

let serviceAccount = null;

// 1. In Vercel: read from env var (full JSON of service account)
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env:', err);
  }
} else {
  // 2. Local development: try local JSON file (which is .gitignored)
  try {
    // This file exists only on your machine, not in the repo
    // eslint-disable-next-line global-require, import/no-dynamic-require
    serviceAccount = require('./serviceAccountKey.json');
  } catch (err) {
    console.warn(
      'Firebase serviceAccountKey.json not found and FIREBASE_SERVICE_ACCOUNT is not set. Firebase Admin will not be initialized.'
    );
  }
}

// Initialize Firebase Admin only if we have credentials
if (serviceAccount) {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} else {
  console.warn('Firebase Admin NOT initialized (no credentials).');
}

module.exports = admin;
