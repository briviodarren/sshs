/* public/firebase-messaging-sw.js */
/* eslint-disable no-undef */

importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js");

// Harus SAMA persis dengan config di src/firebase.js
const firebaseConfig = {
  apiKey: "AIzaSyAlmPCI2rJ3-dWHuEhmgO2dLfxfz_HvX30",
  authDomain: "sshs-portal.firebaseapp.com",
  projectId: "sshs-portal",
  storageBucket: "sshs-portal.firebasestorage.app",
  messagingSenderId: "245047416712",
  appId: "1:245047416712:web:90f18eeccba921bca5cc3d",
  measurementId: "G-DNX8SHMT7T",
};

// Init Firebase di service worker
firebase.initializeApp(firebaseConfig);

// Ambil messaging instance
const messaging = firebase.messaging();

// Handle background messages (ketika tab tertutup/minimized)
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);

  const notificationTitle = payload.notification?.title || "New notification";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/favicon.ico",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
