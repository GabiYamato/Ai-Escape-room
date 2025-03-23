import { useLocation } from 'react-router-dom';
import '../styles/StageProgress.css';

const StageProgress = () => {
  const location = useLocation();
  
  // Determine current stage based on route
  const getCurrentStage = () => {
    const path = location.pathname;
    if (path === '/stage1' || path === '/game') return 1;
    if (path === '/stage2') return 2;
    if (path === '/stage3') return 3;
    if (path === '/stage4') return 4;
    return 0;
  };
  
  const currentStage = getCurrentStage();
  
  return (
    <div className="stage-progress">
      <div className="progress-title">Progress</div>
      <div className="progress-track">
        {[1, 2, 3, 4].map(stage => (
          <div 
            key={stage} 
            className={`progress-node ${currentStage >= stage ? 'completed' : ''} ${currentStage === stage ? 'current' : ''}`}
          >
            {stage}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StageProgress;
