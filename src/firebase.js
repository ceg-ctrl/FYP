// 1. Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  enableIndexedDbPersistence 
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// 2. Your web app's Firebase configuration
// REPLACE the strings below with your actual keys from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCr0T_iUtBZWucohKddC40m9Ku-f1-DimI",
  authDomain: "fyp-fd-tracker-b4602.firebaseapp.com",
  projectId: "fyp-fd-tracker-b4602",
  storageBucket: "fyp-fd-tracker-b4602.firebasestorage.app",
  messagingSenderId: "774525267132",
  appId: "1:774525267132:web:1ab55b18f906705d1334b9",
  measurementId: "G-FW89E0ZHND"
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 4. Initialize Services
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// 5. Enable Offline Persistence (IndexedDB)
// This makes the app work offline by storing data locally in the browser
enableIndexedDbPersistence(db)
  .catch((err) => {
      if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one tab at a time.
          console.warn("Firebase persistence failed: Multiple tabs open.");
      } else if (err.code === 'unimplemented') {
          // The current browser does not support all of the features required to enable persistence
          console.warn("Firebase persistence not supported by this browser.");
      }
  });

// 6. Export services so they can be used in other files
export { db, auth, googleProvider };