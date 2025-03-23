import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startGame } from '../services/api';
import '../styles/SplashScreen.css';
import DevResetTrigger from '../components/DevResetTrigger';

const SplashScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleBeginChallenge = async () => {
    setIsLoading(true);
    try {
      await startGame();
      navigate('/role-selection');
    } catch (error) {
      console.error('Failed to start game:', error);
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="loading-container">
        Loading...
        <DevResetTrigger />
      </div>
    );
  }
  
  return (
    <div className="splash-container paper-bg">
      <div className="splash-content">
        <h1>AI Escape Room</h1>
        <p className="splash-description">
          Work together as a team to escape from Dr. Finkelstein's AI laboratory. 
          Each team member will face a unique challenge that contributes to the 
          final escape sequence.
        </p>
        
        <button 
          className="begin-button"
          onClick={handleBeginChallenge}
        >
          BEGIN CHALLENGE
        </button>
      </div>
      <DevResetTrigger />
    </div>
  );
};

export default SplashScreen;
