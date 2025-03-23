import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CodeSnippet from './CodeSnippet';
import { resetGame } from '../services/api';
import '../styles/Sidebar.css';

const Sidebar = ({ timer }) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Format timer as minutes:seconds
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get current stage based on pathname
  const getCurrentStage = () => {
    const path = location.pathname;
    if (path === '/stage1' || path === '/game') return 1;
    if (path === '/stage2') return 2;
    if (path === '/stage3') return 3;
    if (path === '/stage4') return 4;
    return 0;
  };
  
  // Show password dialog
  const promptForPassword = () => {
    setPassword('');
    setPasswordError('');
    setShowPasswordDialog(true);
  };
  
  // Toggle sidebar collapsed state
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };
  
  // Development-only reset function
  const handleDevReset = async () => {
    // The correct password is 1979
    if (password !== '1979') {
      setPasswordError('Incorrect password');
      return;
    }
    
    try {
      // Fully reset the game using the API
      await resetGame();
      // Navigate to splash screen
      navigate('/', { replace: true });
      // Close dialog
      setShowPasswordDialog(false);
    } catch (error) {
      console.error('Failed to reset game:', error);
      // Fallback if API call fails
      setPasswordError('Error resetting game. Please try again.');
    }
  };
  
  // Get instructions based on current stage with shuffled text
  const getInstructions = () => {
    const stage = getCurrentStage();
    
    switch(stage) {
      case 1:
        return (
          <>
            <h3>Stage 1: The Puzzle Room</h3>
            <p>AI-generated discover code the find door to images.</p>
          </>
        );
      case 2:
        return (
          <>
            <h3>Stage 2: The Radio Room</h3>
            <p>Morse find the key to decode message next the.</p>
          </>
        );
      case 3:
        return (
          <>
            <h3>Stage 3: The Testing Chamber</h3>
            <p>Door reveal quiz the code to answer questions.</p>
          </>
        );
      case 4:
        return (
          <>
            <h3>Final Stage: The Laboratory</h3>
            <p>ML facility to algorithm the escape complete.</p>
          </>
        );
      default:
        return (
          <>
            <h3>Welcome</h3>
            <p>Begin AI the Escape Room challenge.</p>
          </>
        );
    }
  };
  
  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Collapse toggle button */}
      <button 
        className="sidebar-toggle" 
        onClick={toggleSidebar} 
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? '»' : '«'}
      </button>
      
      {/* PART 1: Timer and Reset */}
      <div className="timer-section">
        <h3>Time Elapsed</h3>
        <div className="timer-display">{formatTime(timer)}</div>
        
        {/* Temporary dev reset button */}
        <button 
          className="dev-reset-button" 
          onClick={promptForPassword}
          title="Reset game progress (DEV ONLY)"
        >
          🔄 Reset Game (DEV)
        </button>
      </div>
      
      {/* PART 2: Stage Instructions */}
      <div className="instruction-section">
        <h2>Escape Room</h2>
        <div className="hint-section">
          {getInstructions()}
        </div>
      </div>
      
      {/* PART 3: Code Snippets */}
      <div className="code-snippets-section">
        <h3>Collected Code Snippets</h3>
        <div className="code-locks">
          <CodeSnippet 
            stage={1} 
            currentStage={getCurrentStage()} 
            snippetId="data-loading"
          />
          <CodeSnippet 
            stage={2} 
            currentStage={getCurrentStage()} 
            snippetId="model-training"
          />
          <CodeSnippet 
            stage={3} 
            currentStage={getCurrentStage()} 
            snippetId="evaluation-prediction"
          />
        </div>
      </div>
      
      {/* Password Dialog */}
      {showPasswordDialog && (
        <div className="password-dialog-overlay">
          <div className="password-dialog">
            <h3>Enter Developer Password</h3>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
            />
            
            {passwordError && <p className="password-error">{passwordError}</p>}
            
            <div className="password-buttons">
              <button onClick={() => setShowPasswordDialog(false)}>Cancel</button>
              <button onClick={handleDevReset}>Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
