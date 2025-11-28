import React, { useState, useEffect } from 'react';
import './App.css';
import FDForm from './components/FDForm';
import FDList from './components/FDList';
import SignIn from './components/SignIn';
import DashboardSummary from './components/DashboardSummary';
import MarketRates from './components/MarketRates'; 
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState(null);
  const [fds, setFds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // NEW: State for AI Scanner
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState(null);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setFds([]); 
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Fetching
  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, "fds"), 
        where("userId", "==", user.uid),
        orderBy("maturityDate")
      );
      const unsubscribe = onSnapshot(q, 
        (querySnapshot) => {
          const fdArray = [];
          querySnapshot.forEach((doc) => {
            fdArray.push({ ...doc.data(), id: doc.id });
          });
          setFds(fdArray);
          setLoading(false);
        },
        (error) => {
          console.error("Firestore Error:", error); // Check console for the Index Link!
          alert("Error loading data: " + error.message);
          setLoading(false); // Stop loading so the screen isn't stuck
        }
      );
      return () => unsubscribe();
    }
  }, [user]);

  const handleLogout = () => {
    signOut(auth);
    setIsUserMenuOpen(false); 
  };

  // Handler when user clicks a rate in the AI Scanner
  const handleSelectRate = (rateData) => {
    setFormInitialData(rateData); // Save the data
    setIsScannerOpen(false);      // Close the scanner modal
    setIsFormOpen(true);          // Open the form modal immediately
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
            </div>
          </header>

          <main className="main-container">
            
            <div className="dashboard-controls">
              <DashboardSummary fds={fds} />
              
              <div className="action-bar">
                {/* Scan Rates Button */}
                <button 
                  className="add-btn" 
                  style={{ marginRight: '10px', backgroundColor: '#4f46e5' }} // Distinct color
                  onClick={() => setIsScannerOpen(true)}
                >
                  🤖 Scan Rates
                </button>

                <button 
                  className="add-btn" 
                  onClick={() => { setFormInitialData(null); setIsFormOpen(true); }}
                >
                  + New Deposit
                </button>
              </div>
            </div>

            <FDList fds={fds} />

            {/* Market Rates Modal */}
            {isScannerOpen && (
              <div className="modal-overlay" onClick={() => setIsScannerOpen(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <button className="close-modal" onClick={() => setIsScannerOpen(false)}>×</button>
                  <MarketRates 
                    onClose={() => setIsScannerOpen(false)} 
                    onSelectRate={handleSelectRate} 
                  />
                </div>
              </div>
            )}

            {/* Existing Form Modal */}
            {isFormOpen && (
              <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <button className="close-modal" onClick={() => setIsFormOpen(false)}>×</button>
                  {/* Pass the initialData prop here */}
                  <FDForm 
                    user={user} 
                    onClose={() => setIsFormOpen(false)} 
                    initialData={formInitialData} 
                  /> 
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