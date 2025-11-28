// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFunctions } from "firebase/functions"; // <--- 1. Import this

const firebaseConfig = {
  apiKey: "AIzaSyCr0T_iUtBZWucohKddC40m9Ku-f1-DimI",
  authDomain: "fyp-fd-tracker-b4602.firebaseapp.com",
  projectId: "fyp-fd-tracker-b4602",
  storageBucket: "fyp-fd-tracker-b4602.firebasestorage.app",
  messagingSenderId: "774525267132",
  appId: "1:774525267132:web:1ab55b18f906705d1334b9",
  measurementId: "G-FW89E0ZHND"
};

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// 2. Initialize Functions (Region MUST match your backend: asia-southeast1)
const functions = getFunctions(app, "asia-southeast1");

enableIndexedDbPersistence(db).catch((err) => {
    console.warn("Persistence error:", err.code);
});

// 3. Export functions
export { db, auth, googleProvider, functions };