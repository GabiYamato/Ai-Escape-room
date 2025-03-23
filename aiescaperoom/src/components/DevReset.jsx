import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAllGameState } from '../utils/gameState';
import '../styles/DevReset.css';

const DevReset = ({ onClose }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleReset = () => {
    // Check if password is correct (1979)
    if (password === '1979') {
      // Reset app to initial state
      clearAllGameState();
      
      // Navigate to role selection
      navigate('/', { replace: true });
      onClose();
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <div className="dev-reset-overlay">
      <div className="dev-reset-dialog">
        <h2>Developer Reset</h2>
        <p>Enter the developer password to reset the application:</p>
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          autoFocus
        />
        
        {error && <p className="error-message">{error}</p>}
        
        <div className="dev-reset-buttons">
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button className="reset-button" onClick={handleReset}>Reset</button>
        </div>
      </div>
    </div>
  );
};

export default DevReset;
