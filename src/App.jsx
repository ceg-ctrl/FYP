import React, { useState, useEffect } from 'react';
import './App.css';
import FDForm from './components/FDForm';
import FDList from './components/FDList';
import SignIn from './components/SignIn';
import DashboardSummary from './components/DashboardSummary'; // Import Summary
import { auth, db } from './firebase'; // Import DB
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore'; // Import Query tools

function App() {
  const [user, setUser] = useState(null);
  const [fds, setFds] = useState([]); // State moved here
  const [loading, setLoading] = useState(true);

  // 1. Handle Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Handle Data Fetching (Only if user is logged in)
  useEffect(() => {
    if (user) {
      // Query: Get MY data, sorted by date
      const q = query(
        collection(db, "fds"), 
        where("userId", "==", user.uid),
        orderBy("maturityDate")
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fdArray = [];
        querySnapshot.forEach((doc) => {
          fdArray.push({ ...doc.data(), id: doc.id });
        });
        setFds(fdArray);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setFds([]);
    }
  }, [user]);

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) return <div className="loading">Loading Finance Data...</div>;

  return (
    <div className="App">
      <header className="app-header">
        <h1>Fixed Deposit Tracker</h1>
        {user && (
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        )}
      </header>

      <main>
        {!user ? (
          <SignIn />
        ) : (
          <>
            {/* 1. Show The Summary Cards */}
            <DashboardSummary fds={fds} />

            {/* 2. Show The Form */}
            <FDForm user={user} />

            {/* 3. Show The List (Pass fds as props now!) */}
            <FDList fds={fds} /> 
          </>
        )}
      </main>
    </div>
  );
}

export default App;