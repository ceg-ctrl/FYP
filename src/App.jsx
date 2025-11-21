import React, { useState, useEffect } from 'react';
import './App.css';
import FDForm from './components/FDForm';
import FDList from './components/FDList';
import SignIn from './components/SignIn';
import DashboardSummary from './components/DashboardSummary';
import NotificationManager from './components/NotificationManager';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState(null);
  const [fds, setFds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // 1. FIXED: Handle Auth & Data Clearing Here
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        // If user logged out, we clear the data HERE.
        // This avoids the "synchronous setState in effect" error.
        setFds([]); 
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. FIXED: Data Fetching Effect (No 'else' block needed anymore)
  useEffect(() => {
    if (user) {
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
    }
    // The 'else' block is removed to fix the error.
  }, [user]);

  const handleLogout = () => {
    signOut(auth);
    setIsUserMenuOpen(false); 
  };

  if (loading) return <div className="loading-screen">Loading...</div>;

  return (
    <div className="App">
      {!user ? (
        <SignIn />
      ) : (
        <>
          <header className="app-header">
            <div className="header-content">
              <h1>FD Tracker</h1>
              
              {/* User Menu Dropdown */}
              <div className="user-menu-container">
                <button 
                  className="user-menu-btn" 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="user-avatar" />
                  ) : (
                    <span className="user-initial">
                      {user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
                    </span>
                  )}
                  <span className="user-name-display">{user.displayName || user.email.split('@')[0]}</span>
                  <span className="dropdown-arrow">▼</span>
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="menu-overlay" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="dropdown-menu">
                      <div className="dropdown-header">
                        <p className="dropdown-user-name">{user.displayName || 'User'}</p>
                        <p className="dropdown-user-email">{user.email}</p>
                      </div>
                      <div className="dropdown-divider" />
                      <button className="dropdown-item" onClick={() => alert("Manage Account page coming soon!")}>
                        Manage Account
                      </button>
                      <button className="dropdown-item logout-item" onClick={handleLogout}>
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
              {/* END User Menu */}

            </div>
          </header>

          <main className="main-container">
            <NotificationManager user={user} />

            <div className="dashboard-controls">
              <DashboardSummary fds={fds} />
              
              <div className="action-bar">
                <button 
                  className="add-btn" 
                  onClick={() => setIsFormOpen(true)}
                >
                  + New Deposit
                </button>
              </div>
            </div>

            <FDList fds={fds} />

            {isFormOpen && (
              <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <button className="close-modal" onClick={() => setIsFormOpen(false)}>×</button>
                  <FDForm user={user} onClose={() => setIsFormOpen(false)} /> 
                </div>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;