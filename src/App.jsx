import React, { useState, useEffect } from 'react';
import './App.css';
import FDForm from './components/FDForm';
import FDList from './components/FDList';
import SignIn from './components/SignIn';
import DashboardSummary from './components/DashboardSummary';
import MarketRates from './components/MarketRates'; 
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, onSnapshot, orderBy, where, addDoc } from 'firebase/firestore';
import { exportToExcel, parseExcelFile } from './utils/excelHelper';

function App() {
  const [user, setUser] = useState(null);
  const [fds, setFds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState(null);

  // 1. Theme Effect
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // 2. Auth Listener
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

  // 3. Data Fetching
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
          console.error("Firestore Error:", error);
          setLoading(false);
        }
      );
      return () => unsubscribe();
    }
  }, [user]);

  const handleLogout = () => {
    signOut(auth);
    setIsUserMenuOpen(false); 
  };

  const handleSelectRate = (rateData) => {
    setFormInitialData(rateData);
    setIsScannerOpen(false);
    setIsFormOpen(true);
  };

  // --- Excel Handlers ---
  const handleExport = () => {
    exportToExcel(fds, `FD_Portfolio_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!window.confirm("This will add new entries to your portfolio. Continue?")) {
      e.target.value = null; // Reset input
      return;
    }

    try {
      setLoading(true);
      const data = await parseExcelFile(file);
      
      let count = 0;
      // Add documents one by one (batching is better for large sets, but this is simple)
      for (const item of data) {
        await addDoc(collection(db, "fds"), {
          ...item,
          userId: user.uid,
          createdAt: new Date()
        });
        count++;
      }
      
      alert(`Successfully imported ${count} records!`);
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to import file. Please check the format.");
    } finally {
      setLoading(false);
      e.target.value = null; // Reset input
    }
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
              
              <div className="header-right">
                {/* Theme Toggle */}
                <button className="theme-btn" onClick={toggleTheme} title="Toggle Theme">
                  {theme === 'light' ? '🌙' : '☀️'}
                </button>

                <div className="user-menu-container">
                  <button 
                    className="user-menu-btn" 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="user-avatar" />
                    ) : (
                      <span className="user-initial">
                        {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                      </span>
                    )}
                    <span className="user-name-display">{user.displayName}</span>
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
                        <button className="dropdown-item logout-item" onClick={handleLogout}>
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="main-container">
            
            <div className="dashboard-controls">
              <DashboardSummary fds={fds} />
              
              <div className="action-bar">
                {/* Import / Export */}
                <label className="file-input-label">
                  📂 Import Excel
                  <input type="file" accept=".xlsx, .xls" onChange={handleImport} style={{display: 'none'}} />
                </label>
                
                <button className="secondary-btn" onClick={handleExport}>
                  📥 Export
                </button>

                <div style={{width: '10px'}}></div> {/* Spacer */}

                {/* Scan Rates Button */}
                <button 
                  className="add-btn" 
                  style={{ backgroundColor: '#4f46e5' }} 
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

            {/* Modals */}
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

            {isFormOpen && (
              <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <button className="close-modal" onClick={() => setIsFormOpen(false)}>×</button>
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