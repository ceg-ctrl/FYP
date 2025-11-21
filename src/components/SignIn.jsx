import React from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import './SignIn.css'; // We'll create this simple style next

const SignIn = () => {
  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error signing in", error);
      alert("Login Failed: " + error.message);
    }
  };

  return (
    <div className="signin-container">
      <h2>Welcome to FD Tracker</h2>
      <p>Please sign in to track your investments securely.</p>
      <button className="google-btn" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
    </div>
  );
};

export default SignIn;