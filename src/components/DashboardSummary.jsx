import React, { useState } from 'react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import './DashboardSummary.css';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#9333ea', '#0891b2'];

const DashboardSummary = ({ fds }) => {
  const [expandedView, setExpandedView] = useState(null); // 'principal' | 'interest' | null

  // 1. Filter active FDs
  const activeFDs = fds.filter(fd => fd.status === 'active');

  // 2. Existing Totals Calculations
  const totalPrincipal = activeFDs.reduce((acc, fd) => acc + (parseFloat(fd.principal) || 0), 0);

  const totalInterest = activeFDs.reduce((acc, fd) => {
    const principal = parseFloat(fd.principal) || 0;
    const rate = parseFloat(fd.interestRate) || 0;
    const start = new Date(fd.startDate);
    const end = new Date(fd.maturityDate);
    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)); 
    const tenureYears = diffDays / 365;
    return acc + (principal * (rate / 100) * tenureYears);
  }, 0);

  const formatMoney = (amount) => {
    return amount.toLocaleString('en-MY', { style: 'currency', currency: 'MYR' });
  };

  // --- Graph Data Helpers ---

  // Data for "Total Invested" (Pie Chart by Bank)
  const getPrincipalData = () => {
    const bankMap = {};
    activeFDs.forEach(fd => {
      const bank = fd.bankName || "Unknown";
      const amount = parseFloat(fd.principal) || 0;
      bankMap[bank] = (bankMap[bank] || 0) + amount;
    });
    return Object.keys(bankMap).map(bank => ({ name: bank, value: bankMap[bank] }));
  };

  // Data for "Expected Returns" (Bar Chart by Maturity Month)
  const getInterestData = () => {
    const interestMap = {};
    activeFDs.forEach(fd => {
      const principal = parseFloat(fd.principal) || 0;
      const rate = parseFloat(fd.interestRate) || 0;
      const start = new Date(fd.startDate);
      const end = new Date(fd.maturityDate);
      
      // Calculate specific interest for this FD
      const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
      const interest = principal * (rate / 100) * (diffDays / 365);

      // Group by Month-Year of Maturity (e.g., "Dec 2025")
      const monthYear = end.toLocaleString('default', { month: 'short', year: '2-digit' });
      
      // We need a sortable key (YYYY-MM)
      const sortKey = end.toISOString().slice(0, 7); 
      
      if (!interestMap[sortKey]) {
        interestMap[sortKey] = { name: monthYear, value: 0, sortKey };
      }
      interestMap[sortKey].value += interest;
    });

    // Convert to array and sort by date
    return Object.values(interestMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  };

  const toggleView = (view) => {
    if (expandedView === view) {
      setExpandedView(null); // Collapse if clicking same box
    } else {
      setExpandedView(view); // Expand new view
    }
  };

  return (
    <div className="dashboard-summary-container">
      {/* Cards Row */}
      <div className="dashboard-summary">
        <div 
          className={`summary-card total-principal ${expandedView === 'principal' ? 'active-card' : ''}`}
          onClick={() => toggleView('principal')}
        >
          <h3>Total Invested</h3>
          <p>{formatMoney(totalPrincipal)}</p>
          <span className="subtitle">{activeFDs.length} Active Deposits</span>
          <div className="hint-text">{expandedView === 'principal' ? 'Click to Close' : 'Click for Portfolio'}</div>
        </div>

        <div 
          className={`summary-card total-interest ${expandedView === 'interest' ? 'active-card' : ''}`}
          onClick={() => toggleView('interest')}
        >
          <h3>Expected Returns</h3>
          <p>+ {formatMoney(totalInterest)}</p>
          <span className="subtitle">Total Interest Earnings</span>
          <div className="hint-text">{expandedView === 'interest' ? 'Click to Close' : 'Click for Timeline'}</div>
        </div>
      </div>

      {/* Expandable Chart Section */}
      {expandedView && (
        <div className="summary-chart-section">
          {expandedView === 'principal' && (
            <div className="chart-wrapper">
              <h4>💰 Investment Allocation by Bank</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getPrincipalData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {getPrincipalData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatMoney(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {expandedView === 'interest' && (
            <div className="chart-wrapper">
              <h4>📅 Projected Monthly Returns</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getInterestData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatMoney(value)} />
                  <Bar dataKey="value" fill="#16a34a" name="Interest Earnings" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardSummary;