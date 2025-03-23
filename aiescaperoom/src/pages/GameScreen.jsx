import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { syncGameState } from '../services/api';

// This component is now just a redirect wrapper to maintain backward compatibility
const GameScreen = ({ timer, setTimer }) => {
  const navigate = useNavigate();
  
  // Sync timer with backend once, then redirect to StageOne
  useEffect(() => {
    const syncAndRedirect = async () => {
      try {
        // Sync timer one last time
        const response = await syncGameState('stage1');
        if (response.timer !== undefined) {
          setTimer(response.timer);
        }
        
        // Redirect to StageOne
        navigate('/stage1', { replace: true });
      } catch (error) {
        console.error('Error syncing timer:', error);
        // Still redirect even if sync fails
        navigate('/stage1', { replace: true });
      }
    };
    
    syncAndRedirect();
  }, [navigate, setTimer]);
  
  // Show minimal loading content while redirecting
  return (
    <div className="loading-screen">
      Redirecting to first stage...
    </div>
  );
};

export default GameScreen;
