import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initGameState, resetGame, startGame } from '../services/api';
import '../styles/SplashScreen.css';

const SplashScreen = () => {
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkSavedGame = async () => {
      try {
        const gameState = await initGameState();
        setHasSavedGame(gameState.startTime !== null);
      } catch (error) {
        console.error('Failed to check saved game:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkSavedGame();
  }, []);
  
  const handleStart = async () => {
    setIsLoading(true);
    try {
      // Start or continue the game on the server
      await startGame();
      navigate('/game');
    } catch (error) {
      console.error('Failed to start game:', error);
      setIsLoading(false);
    }
  };
  
  const handleStartNew = async () => {
    setIsLoading(true);
    try {
      await resetGame();
      await startGame();
      navigate('/game');
    } catch (error) {
      console.error('Failed to reset game:', error);
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return <div className="loading-container">Loading game data...</div>;
  }
  
  return (
    <div className="splash-container">
      <div className="splash-content">
        <h1>AI Escape Room</h1>
        <p className="tagline">Decode the AI secrets to escape</p>
        
        <div className="intro-text">
          <p>
            You're trapped in a virtual chamber filled with images. 
            Some of these images were created by AI, and they hold the key to your escape.
          </p>
          <p>
            Use your detective skills to identify the AI-generated images, 
            decode their secrets, and find the master code to advance to the next stage.
          </p>
        </div>
        
        <div className="button-container">
          {hasSavedGame && (
            <button className="start-button continue" onClick={handleStart}>
              Continue Game
            </button>
          )}
          
          <button 
            className={`start-button ${hasSavedGame ? 'new-game' : ''}`} 
            onClick={hasSavedGame ? handleStartNew : handleStart}
          >
            {hasSavedGame ? 'Start New Game' : 'Begin Challenge'}
          </button>
        </div>
      </div>
      
      <div className="splash-decoration"></div>
    </div>
  );
};

export default SplashScreen;
