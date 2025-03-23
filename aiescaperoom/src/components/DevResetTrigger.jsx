import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DevResetTrigger = () => {
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState('');

  const openConfirmation = () => {
    setShowConfirmation(true);
    setConfirmCode('');
    setError('');
  };

  const resetGame = () => {
    if (confirmCode.toLowerCase() !== 'reset') {
      setError('Please type "RESET" to confirm');
      return;
    }
    
    // Clear all session/local storage
    localStorage.removeItem('seed');
    localStorage.removeItem('discoveredCodes');
    localStorage.removeItem('completedStages');
    localStorage.removeItem('gameState');
    
    // Clear all other game state stored in localStorage
    const keysToRemove = [];
    for(let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if(key && key.startsWith('ai_escape_')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Force reload to the home page
    navigate('/', { replace: true });
    window.location.reload();
  };

  return (
    <>
      <div className="dev-reset-trigger" onClick={openConfirmation}>
        [DEV: Reset Game]
      </div>
      
      {showConfirmation && (
        <div className="dev-reset-confirmation-overlay">
          <div className="dev-reset-confirmation-dialog">
            <h3>Confirm Game Reset</h3>
            <p>This will reset all game progress. Enter "RESET" to confirm:</p>
            <input 
              type="text" 
              value={confirmCode} 
              onChange={(e) => setConfirmCode(e.target.value)}
              placeholder="Type RESET"
            />
            {error && <p className="dev-reset-error">{error}</p>}
            <div className="dev-reset-buttons">
              <button onClick={() => setShowConfirmation(false)}>Cancel</button>
              <button onClick={resetGame}>Reset Game</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DevResetTrigger;
