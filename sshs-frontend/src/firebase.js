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

console.log("VAPID KEY:", import.meta.env.VITE_FIREBASE_VAPID_KEY);


let messaging = null;
try {
  messaging = getMessaging(app);
} catch (err) {
  console.error("Failed to init Firebase Messaging:", err);
}

/**
 * Request FCM token for this browser.
 * We explicitly use the existing service worker registration so Firebase
 * doesn't try to register its own behind the scenes.
 */
export const requestForToken = async () => {
  if (!messaging) {
    console.warn("Messaging not initialized, cannot get token.");
    return null;
  }

  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers are not supported in this browser.");
    return null;
  }

  try {
    // Wait for the existing SW registration (the one you already see logged).
    const registration = await navigator.serviceWorker.ready;
    console.log("Using SW registration for FCM:", registration);

    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      console.log("Got FCM token:", currentToken);
      return currentToken;
    } else {
      console.log(
        "No registration token available (permission may be 'default' or 'denied')."
      );
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving token.");
    console.error("name:", err.name);
    console.error("message:", err.message);
    console.error("stack:", err.stack);
    // If it's a FirebaseError, log its code too
    if (err.code) {
      console.error("code:", err.code);
    }
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
