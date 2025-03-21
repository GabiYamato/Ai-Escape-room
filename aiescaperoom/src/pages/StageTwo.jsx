import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { resetGame } from '../services/api';
import '../styles/StageTwo.css';

const StageTwo = ({ timer }) => {
  const navigate = useNavigate();

  const handleRestart = async () => {
    try {
      await resetGame();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed to restart game:', error);
    }
  };

  return (
    <div className="stage-two-container">
      <Sidebar timer={timer} />
      <div className="stage-two-content">
        <h1>STAGE 2</h1>
        <div className="success-message">
          <p>Congratulations! You've successfully decoded the AI-generated image pattern.</p>
          <p>Time elapsed: {Math.floor(timer / 60)}m {timer % 60}s</p>
        </div>
        <div className="next-challenge">
          <h2>Your next challenge awaits...</h2>
          <button className="continue-button">Coming Soon</button>
          <button className="restart-button" onClick={handleRestart}>
            Restart Challenge
          </button>
        </div>
      </div>
    </div>
  );
};

export default StageTwo;
