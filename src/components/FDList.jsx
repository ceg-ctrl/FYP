import React from 'react'; // Removed useEffect, useState imports
import { db } from '../firebase';
import { deleteDoc, doc } from 'firebase/firestore';
import './FDList.css';

// Now accepts 'fds' as a prop
const FDList = ({ fds }) => {

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

  return (
    <div className="fd-list-container">
      <h3>Your Portfolio</h3>
      {fds.length === 0 ? (
        <p>No Fixed Deposits found.</p>
      ) : (
        <div className="fd-grid">
          {fds.map((fd) => (
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