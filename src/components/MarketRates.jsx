import React, { useState, useEffect } from 'react';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import './MarketRates.css'; // We'll create this style next

const MarketRates = ({ onClose, onSelectRate }) => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const getMarketRates = httpsCallable(functions, 'getMarketRates');
        const result = await getMarketRates();
        setRates(result.data);
      } catch (err) {
        console.error("AI Error:", err);
        setError("Failed to load rates. AI might be busy.");
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  return (
    <div className="market-rates-container">
      <h3>📈 Market Rates (AI Scanned)</h3>
      
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Scanning Malaysian banks...</p>
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}

      {!loading && !error && (
        <div className="rates-list">
          {rates.map((rate, index) => (
            <div key={index} className="rate-card" onClick={() => onSelectRate(rate)}>
              <div className="rate-header">
                <span className="bank-label">{rate.bank}</span>
                <span className="rate-value">{rate.rate}%</span>
              </div>
              <div className="rate-details">
                <span>{rate.tenure}</span>
                <span className="promo-tag">{rate.description}</span>
              </div>
              <button className="use-rate-btn">Use This</button>
            </div>
          ))}
        </div>
      )}

      <button className="btn-cancel full-width" onClick={onClose}>Close</button>
    </div>
  );
};

export default MarketRates;