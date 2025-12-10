import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAlmPCI2rJ3-dWHuEhmgO2dLfxfz_HvX30",
  authDomain: "sshs-portal.firebaseapp.com",
  projectId: "sshs-portal",
  storageBucket: "sshs-portal.firebasestorage.app",
  messagingSenderId: "245047416712",
  appId: "1:245047416712:web:90f18eeccba921bca5cc3d",
  measurementId: "G-DNX8SHMT7T"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
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
    console.log("An error occurred while retrieving token.", err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
