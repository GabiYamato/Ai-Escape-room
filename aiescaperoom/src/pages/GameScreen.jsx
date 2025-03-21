import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ImageGrid from '../components/ImageGrid';
import CommandInput from '../components/CommandInput';
import CodeEntryOverlay from '../components/CodeEntryOverlay';
import HelpButton from '../components/HelpButton';
import { syncGameState, reportWrongCode } from '../services/api';
import imageData from '../data/images.json';
import '../styles/GameScreen.css';

const GameScreen = ({ timer, setTimer }) => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [decodedImage, setDecodedImage] = useState(null);
  const [commandError, setCommandError] = useState(null);
  const navigate = useNavigate();
  
  // Sync timer with backend periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await syncGameState('game');
        if (response.timer !== undefined) {
          setTimer(response.timer);
        }
      } catch (error) {
        console.error('Error syncing timer:', error);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [setTimer]);
  
  const handleCommand = (command) => {
    setCommandError(null);
    const parts = command.split(' ');
    if (parts[0].toUpperCase() === 'DECODE' && parts.length === 3) {
      const row = parseInt(parts[1]);
      const col = parseInt(parts[2]);
      
      const foundImage = imageData.images.find(img => 
        img.position[0] === row && img.position[1] === col
      );
      
      if (foundImage) {
        // Only provide the code, not whether it's AI generated
        setDecodedImage({
          position: `${row} ${col}`,
          code: foundImage.code
        });
      } else {
        setDecodedImage({
          position: `${row} ${col}`,
          code: 'Image not found'
        });
      }
    } else {
      setCommandError("Invalid command. Use format: DECODE [row] [column]");
    }
  };
  
  const handleCodeEntry = () => {
    setShowOverlay(true);
  };
  
  const handleCodeSubmit = async (enteredCode) => {
    // The solution code is formed by combining the codes from AI-generated images
    const correctCode = "A7E3I8P6"; // This should match the code in solution.txt
    
    if (enteredCode === correctCode) {
      // Save progress before navigating
      await syncGameState('stage2');
      navigate('/stage2');
    } else {
      // Report wrong code to add penalty
      const result = await reportWrongCode();
      if (result && result.timer !== undefined) {
        setTimer(result.timer);
      }
      
      alert('Incorrect code. Try again.\nA penalty of 1 minute has been added to your time.');
    }
    
    setShowOverlay(false);
  };
  
  return (
    <div className="game-container">
      <Sidebar timer={timer} />
      <div className="main-content">
        <div className="game-instructions">
          <h2>Find the AI-Generated Images</h2>
          <p>Use the <code>DECODE [row] [column]</code> command to reveal the code of each image.</p>
          <p>Combine codes from AI-generated images to find the master code.</p>
        </div>
        
        <ImageGrid images={imageData.images} />
        
        <div className="command-section">
          {decodedImage && (
            <div className="decode-result">
              <p>Image at position {decodedImage.position} has code: <strong>{decodedImage.code}</strong></p>
            </div>
          )}
          
          {commandError && (
            <div className="command-error">
              <p>{commandError}</p>
            </div>
          )}
          
          <CommandInput onCommand={handleCommand} />
          
          <button className="code-entry-button" onClick={handleCodeEntry}>
            ENTER CODE
          </button>
        </div>
      </div>
      
      <HelpButton />
      
      {showOverlay && (
        <CodeEntryOverlay onSubmit={handleCodeSubmit} onCancel={() => setShowOverlay(false)} />
      )}
    </div>
  );
};

export default GameScreen;
