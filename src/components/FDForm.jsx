import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { createGoogleCalendarLink } from '../utils/calendarHelper'; 
import './FDForm.css';

const FDForm = ({ user, onClose, initialData }) => { 
  const [formData, setFormData] = useState({
    bankName: '',
    principal: '',
    interestRate: '',
    startDate: '',
    maturityDate: ''
  });

  const [lastSavedFD, setLastSavedFD] = useState(null);

  // NEW: Effect to pre-fill data when 'initialData' prop changes (from AI)
  useEffect(() => {
    if (initialData) {
      // Calculate a default maturity date (1 year from today)
      const today = new Date();
      // Safe way to add 1 year
      const nextYear = new Date(today);
      nextYear.setFullYear(today.getFullYear() + 1);

      setFormData(prev => {
        // Optimization: Only update if data is actually different to avoid loops
        if (prev.bankName === initialData.bank && prev.interestRate === initialData.rate) {
          return prev;
        }
        
        return {
          ...prev,
          bankName: initialData.bank || '',
          interestRate: initialData.rate || '',
          startDate: today.toISOString().split('T')[0],
          maturityDate: nextYear.toISOString().split('T')[0]
        };
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!formData.bankName || !formData.principal) return alert("Please fill required fields");

    try {
      await addDoc(collection(db, "fds"), {
        userId: user.uid,
        bankName: formData.bankName,
        principal: parseFloat(formData.principal),
        interestRate: parseFloat(formData.interestRate),
        startDate: formData.startDate,
        maturityDate: formData.maturityDate,
        status: 'active',
        createdAt: new Date()
      });
      
      setLastSavedFD({
        bankName: formData.bankName,
        principal: formData.principal,
        maturityDate: formData.maturityDate
      });

      // Clear form but keep the "Saved" state visible
      setFormData({ bankName: '', principal: '', interestRate: '', startDate: '', maturityDate: '' });

    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Error saving data");
    }
  };

  return (
    <div className="form-wrapper">
      {/* Only show form if we haven't just saved one (or show both if you prefer) */}
      <form className="fd-form" onSubmit={handleSubmit}>
        <h3 className="form-title">Add New Fixed Deposit</h3>
        
        <div className="form-group">
            <label>Bank Name</label>
            <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="e.g. Maybank" required />
        </div>
        <div className="form-group">
            <label>Principal (RM)</label>
            <input type="number" name="principal" value={formData.principal} onChange={handleChange} placeholder="10000" required />
        </div>
        <div className="form-row">
          <div className="form-group half">
              <label>Interest Rate (%)</label>
              <input type="number" step="0.01" name="interestRate" value={formData.interestRate} onChange={handleChange} placeholder="3.5" required />
          </div>
          <div className="form-group half">
              <label>Start Date</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-group">
            <label>Maturity Date</label>
            <input type="date" name="maturityDate" value={formData.maturityDate} onChange={handleChange} required />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-save">Save FD</button>
        </div>
      </form>

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