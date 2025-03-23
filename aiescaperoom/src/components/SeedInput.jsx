import React, { useState } from 'react';

const SeedInput = ({ onSubmit, initialValue = '' }) => {
  const [seedInput, setSeedInput] = useState(initialValue);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const seedNum = parseInt(seedInput);
    if (seedInput.length !== 5 || !/^\d+$/.test(seedInput)) {
      setError('Seed must be a 5-digit number');
      return;
    }
    
    if (seedNum < 10000 || seedNum > 100019) {
      setError('Seed must be between 10000 and 100019');
      return;
    }
    
    setError('');
    onSubmit(seedInput);
  };

  return (
    <div className="seed-input-group">
      <input
        type="text"
        value={seedInput}
        onChange={(e) => {
          const value = e.target.value.replace(/\D/g, '').slice(0, 5);
          setSeedInput(value);
          setError('');
        }}
        placeholder="Enter 5-digit seed (10000-100019)"
        maxLength="5"
        pattern="\d{5}"
      />
      {error && <div className="seed-input-error">{error}</div>}
      <button 
        className="seed-submit-button" 
        onClick={handleSubmit}
        disabled={seedInput.length !== 5}
      >
        Start Challenge
      </button>
    </div>
  );
};

export default SeedInput;
