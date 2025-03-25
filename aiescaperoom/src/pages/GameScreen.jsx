import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { syncGameState } from '../services/api';

// This component is a redirect wrapper to StageOne
const GameScreen = () => {
  const navigate = useNavigate();
  const [redirectAttempts, setRedirectAttempts] = useState(0);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let mounted = true;
    let redirectTimer = null;
    
    const syncAndRedirect = async () => {
      try {
        // Try to sync with backend, but don't wait too long
        await Promise.race([
          syncGameState('stage1'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Sync timeout')), 2000)
          )
        ]);
        
        // Success! Redirect immediately
        if (mounted) {
          navigate('/stage1', { replace: true });
        }
      } catch (error) {
        console.error('Error syncing or timeout:', error);
        
        // If we're still mounted, try again or redirect anyway after too many attempts
        if (mounted) {
          if (redirectAttempts < 2) {
            setRedirectAttempts(prev => prev + 1);
            redirectTimer = setTimeout(syncAndRedirect, 500);
          } else {
            // Just redirect after 3 attempts
            navigate('/stage1', { replace: true });
          }
        }
      }
    };
    
    // Start the redirect process
    syncAndRedirect();
    
    return () => {
      mounted = false;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [navigate, redirectAttempts]);
  
  // Show better loading screen with error handling
  return (
    <div className="loading-screen" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#121212',
      color: '#fff',
      fontSize: '1.2rem',
      padding: '20px',
      textAlign: 'center'
    }}>
      <p>Initializing game and redirecting to first challenge...</p>
      
      {redirectAttempts > 0 && (
        <p style={{ color: '#ff9800', marginTop: '10px' }}>
          Attempting redirect... ({redirectAttempts}/3)
        </p>
      )}
      
      {redirectAttempts >= 2 && (
        <button
          onClick={() => navigate('/stage1', { replace: true })}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Proceed to Stage One
        </button>
      )}
    </div>
  );
};

export default GameScreen;
