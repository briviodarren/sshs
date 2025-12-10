/* eslint-disable no-undef */
// This is a plain JS service worker file for Firebase Cloud Messaging.

// Import the Firebase scripts for service workers (compat version)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyAlmPCI2rJ3-dWHuEhmgO2dLfxfz_HvX30",
  authDomain: "sshs-portal.firebaseapp.com",
  projectId: "sshs-portal",
  storageBucket: "sshs-portal.firebasestorage.app",
  messagingSenderId: "245047416712",
  appId: "1:245047416712:web:90f18eeccba921bca5cc3d",
  measurementId: "G-DNX8SHMT7T"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notification = payload.notification || {};
  const notificationTitle = notification.title || 'Notification';
  const notificationOptions = {
    body: notification.body || '',
    icon: notification.icon || '/favicon.ico', // change to your icon path if you have one
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
