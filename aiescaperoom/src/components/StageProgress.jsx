import { useLocation } from 'react-router-dom';
import '../styles/StageProgress.css';

const StageProgress = () => {
  let location;
  try {
    location = useLocation();
  } catch (error) {
    console.error('Error using useLocation:', error);
    return null;
  }
  
  const currentPath = location?.pathname || '/';
  
  // Calculate progress based on current path
  let progressValue = 0;
  let stageText = "Stage 1 of 2";
  
  if (currentPath === "/") {
    progressValue = 0;
    stageText = "Not Started";
  } else if (currentPath === "/game") {
    progressValue = 50;
    stageText = "Stage 1 of 2";
  } else if (currentPath === "/stage2") {
    progressValue = 100;
    stageText = "Stage 2 of 2";
  }
  
  return (
    <div className="progress-section">
      <h3>Progress</h3>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progressValue}%` }}
        ></div>
      </div>
      <p>{stageText}</p>
    </div>
  );
};

export default StageProgress;
