// sshs-frontend/src/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAlmPCI2rJ3-dWHuEhmgO2dLfxfz_HvX30",
  authDomain: "sshs-portal.firebaseapp.com",
  projectId: "sshs-portal",
  storageBucket: "sshs-portal.firebasestorage.app",
  messagingSenderId: "245047416712",
  appId: "1:245047416712:web:90f18eeccba921bca5cc3d",
  measurementId: "G-DNX8SHMT7T",
};

const app = initializeApp(firebaseConfig);

let messaging = null;
try {
  messaging = getMessaging(app);
} catch (err) {
  console.error("Failed to init Firebase Messaging:", err);
}

/**
 * Request FCM token for this browser.
 * Returns token string or null on failure.
 */
export const requestForToken = async () => {
  if (!messaging) {
    console.warn("Messaging not initialized, cannot get token.");
    return null;
  }

  try {
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (currentToken) {
      console.log("Got FCM token:", currentToken);
      return currentToken;
    } else {
      console.log("No registration token available.");
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving token.", err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) {
      console.warn("Messaging not initialized, cannot listen for messages.");
      return;
    }
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
