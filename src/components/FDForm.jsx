import React, { useState, useMemo } from 'react';
import { db } from '../firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import './FDList.css';

const FDList = ({ fds }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('maturityDate_asc');

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this FD?")) {
      await deleteDoc(doc(db, "fds", id));
    }
  };

  const calculateMaturityValue = (principal, rate, start, end) => {
    const startDate = new Date(start);
    const maturityDate = new Date(end);
    const diffTime = Math.abs(maturityDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const tenureYears = diffDays / 365;
    const interest = principal * (rate / 100) * tenureYears;
    return (principal + interest).toFixed(2);
  };

  // Logic: Filter -> Sort
  const processedFDs = useMemo(() => {
    let result = [...fds];

    // 1. Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(fd => 
        fd.bankName.toLowerCase().includes(lowerTerm) || 
        fd.principal.toString().includes(lowerTerm)
      );
    }

    // 2. Sort
    result.sort((a, b) => {
      const [field, direction] = sortBy.split('_');
      
      let valA = field === 'principal' || field === 'interestRate' ? parseFloat(a[field]) : new Date(a[field]);
      let valB = field === 'principal' || field === 'interestRate' ? parseFloat(b[field]) : new Date(b[field]);

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [fds, searchTerm, sortBy]);

  return (
    <div className="fd-list-container">
      <h3>Your Portfolio ({processedFDs.length})</h3>
      
      {/* Search and Sort Controls */}
      <div className="list-controls">
        <input 
          type="text" 
          className="search-input" 
          placeholder="🔍 Search bank or amount..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select 
          className="sort-select" 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="maturityDate_asc">Maturity (Earliest)</option>
          <option value="maturityDate_desc">Maturity (Latest)</option>
          <option value="principal_desc">Principal (High-Low)</option>
          <option value="principal_asc">Principal (Low-High)</option>
          <option value="interestRate_desc">Rate (High-Low)</option>
        </select>
      </div>

      {processedFDs.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No matching Fixed Deposits found.</p>
      ) : (
        <div className="fd-grid">
          {processedFDs.map((fd) => (
            <div key={fd.id} className="fd-card">
              <div className="card-header">
                <span className="bank-name">{fd.bankName}</span>
                <button className="delete-btn" onClick={() => handleDelete(fd.id)}>×</button>
              </div>
              <div className="card-body">
                <div className="row">
                  <span>Principal:</span>
                  <strong>RM {fd.principal}</strong>
                </div>
                <div className="row">
                  <span>Rate:</span>
                  <strong>{fd.interestRate}%</strong>
                </div>
                <div className="row">
                  <span>Matures:</span>
                  <strong>{fd.maturityDate}</strong>
                </div>
                <hr />
                <div className="row total">
                  <span>Final Value:</span>
                  <strong>RM {calculateMaturityValue(fd.principal, fd.interestRate, fd.startDate, fd.maturityDate)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FDList;