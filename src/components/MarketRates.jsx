import React, { useState, useEffect } from 'react';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import './MarketRates.css';

const MarketRates = ({ onClose, onSelectRate }) => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortType, setSortType] = useState('rate_desc'); // Default sort: Rate High to Low

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const getMarketRates = httpsCallable(functions, 'getMarketRates');
        const result = await getMarketRates();
        setRates(result.data);
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load rates. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  // Sorting Logic
  const sortedRates = [...rates].sort((a, b) => {
    if (sortType === 'rate_desc') return b.rate - a.rate;
    if (sortType === 'rate_asc') return a.rate - b.rate;
    if (sortType === 'bank_asc') return a.bank.localeCompare(b.bank);
    if (sortType === 'deposit_asc') {
      // Helper to parse "RM10,000" -> 10000
      const valA = parseInt(a.min_deposit.replace(/[^0-9]/g, '')) || 0;
      const valB = parseInt(b.min_deposit.replace(/[^0-9]/g, '')) || 0;
      return valA - valB;
    }
    return 0;
  });

  return (
    <div className="market-rates-container">
      <div className="modal-header">
        <h3>📊 Live Market Rates</h3>
        
        {/* Sorting Controls */}
        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
            <option value="rate_desc">Highest Rate</option>
            <option value="rate_asc">Lowest Rate</option>
            <option value="deposit_asc">Lowest Deposit</option>
            <option value="bank_asc">Bank Name (A-Z)</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Scanning latest promos...</p>
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}

      {!loading && !error && (
        <div className="rates-list">
          {sortedRates.map((rate, index) => (
            <div key={index} className="rate-card" onClick={() => onSelectRate(rate)}>
              <div className="rate-main">
                <div className="bank-info">
                  <span className="bank-name">{rate.bank}</span>
                  <span className="product-name">{rate.product}</span>
                </div>
                <div className="rate-display">
                  <span className="rate-value">{rate.rate.toFixed(2)}%</span>
                  <span className="rate-label">p.a.</span>
                </div>
              </div>
              
              <div className="rate-details-grid">
                <div className="detail-item">
                  <span className="label">Tenure</span>
                  <span className="value">{rate.tenure}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Min Deposit</span>
                  <span className="value">{rate.min_deposit}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Valid Until</span>
                  <span className="value">{rate.valid_until}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn-cancel full-width" onClick={onClose}>Close</button>
    </div>
  );
};

export default MarketRates;