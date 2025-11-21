import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { createGoogleCalendarLink } from '../utils/calendarHelper'; // Import helper
import './FDForm.css';

const FDForm = ({ user }) => { // Receive user prop
  const [formData, setFormData] = useState({
    bankName: '',
    principal: '',
    interestRate: '',
    startDate: '',
    maturityDate: ''
  });

  // State to hold the link for the LAST saved FD
  const [lastSavedFD, setLastSavedFD] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!formData.bankName || !formData.principal) return alert("Please fill required fields");

    try {
      // 1. Save to Firebase
      await addDoc(collection(db, "fds"), {
        userId: user.uid, // Important: Link to user
        bankName: formData.bankName,
        principal: parseFloat(formData.principal),
        interestRate: parseFloat(formData.interestRate),
        startDate: formData.startDate,
        maturityDate: formData.maturityDate,
        status: 'active',
        createdAt: new Date()
      });
      
      // 2. Prepare the Calendar Button
      setLastSavedFD({
        bankName: formData.bankName,
        principal: formData.principal,
        maturityDate: formData.maturityDate
      });

      alert("FD Saved! Now set your reminder.");
      
      // Clear form (but keep lastSavedFD to show the button)
      setFormData({ bankName: '', principal: '', interestRate: '', startDate: '', maturityDate: '' });

    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Error saving data");
    }
  };

  return (
    <div className="form-container">
      <form className="fd-form" onSubmit={handleSubmit}>
        <h3>Add New Fixed Deposit</h3>
        {/* ... (Keep your existing inputs same as before) ... */}
        
        {/* Keep existing inputs for Bank, Principal, Rate, Dates */}
        <div className="form-group">
            <label>Bank Name</label>
            <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} required />
        </div>
        <div className="form-group">
            <label>Principal (RM)</label>
            <input type="number" name="principal" value={formData.principal} onChange={handleChange} required />
        </div>
        <div className="form-group">
            <label>Interest Rate (%)</label>
            <input type="number" step="0.01" name="interestRate" value={formData.interestRate} onChange={handleChange} required />
        </div>
        <div className="form-group">
            <label>Start Date</label>
            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
        </div>
        <div className="form-group">
            <label>Maturity Date</label>
            <input type="date" name="maturityDate" value={formData.maturityDate} onChange={handleChange} required />
        </div>

        <button type="submit">Save FD</button>
      </form>

      {/* --- NEW: The Reminder Button --- */}
      {lastSavedFD && (
        <div className="reminder-box">
          <p>✅ Saved! Don't forget to set a reminder:</p>
          <a 
            href={createGoogleCalendarLink(lastSavedFD)} 
            target="_blank" 
            rel="noopener noreferrer"
            className="calendar-btn"
          >
            📅 Add to Google Calendar
          </a>
        </div>
      )}
    </div>
  );
};

export default FDForm;