import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth"; // Auth ke liye
import { getDatabase } from "firebase/database"; // Realtime DB ke liye (Sales/Stock)

const firebaseConfig = {
  apiKey: "AIzaSyBvYONBZRG5iVmT-dfvRnlv_stwA4K6PIw",
  authDomain: "dharashalti.firebaseapp.com",
  databaseURL: "https://dharashalti-default-rtdb.firebaseio.com",
  projectId: "dharashalti",
  storageBucket: "dharashalti.firebasestorage.app",
  messagingSenderId: "898028048902",
  appId: "1:898028048902:web:b14fa2dc602e6586e8a987",
  measurementId: "G-TDM2PCBD8G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Inhe export karna zaroori hai taaki Login/Register mein use ho sakein
export const auth = getAuth(app);
export const database = getDatabase(app);
export { app };