import React from 'react';
import './DashboardSummary.css'; // We will style this next

const DashboardSummary = ({ fds }) => {
  
  // 1. Filter for only 'active' FDs (we don't count matured/deleted ones in current totals)
  const activeFDs = fds.filter(fd => fd.status === 'active');

  // 2. Calculate Total Principal
  const totalPrincipal = activeFDs.reduce((acc, fd) => acc + (parseFloat(fd.principal) || 0), 0);

  // 3. Calculate Total Expected Interest
  const totalInterest = activeFDs.reduce((acc, fd) => {
    const principal = parseFloat(fd.principal) || 0;
    const rate = parseFloat(fd.interestRate) || 0;
    
    // Calculate tenure in years
    const start = new Date(fd.startDate);
    const end = new Date(fd.maturityDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    const tenureYears = diffDays / 365;

    const interest = principal * (rate / 100) * tenureYears;
    return acc + interest;
  }, 0);

  // 4. Format currency helper
  const formatMoney = (amount) => {
    return amount.toLocaleString('en-MY', {
      style: 'currency',
      currency: 'MYR'
    });
  };

  return (
    <div className="dashboard-summary">
      <div className="summary-card total-principal">
        <h3>Total Invested</h3>
        <p>{formatMoney(totalPrincipal)}</p>
        <span className="subtitle">{activeFDs.length} Active Deposits</span>
      </div>

      <div className="summary-card total-interest">
        <h3>Expected Returns</h3>
        <p>+ {formatMoney(totalInterest)}</p>
        <span className="subtitle">Total Interest Earnings</span>
      </div>
    </div>
  );
};

export default DashboardSummary;