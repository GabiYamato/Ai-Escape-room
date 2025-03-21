import StageProgress from './StageProgress';
import '../styles/Sidebar.css';

const Sidebar = ({ timer }) => {
  // Format timer as minutes:seconds
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="sidebar">
      <div className="timer">
        <h3>Time Elapsed</h3>
        <div className="timer-display">{formatTime(timer)}</div>
      </div>
      <div className="sidebar-content">
        <h2>Escape Room</h2>
        <p>Find the codes hidden in the AI-generated images.</p>
        
        <div className="hint-section">
          <h3>Hints</h3>
          <ul className="hints-list">
            <li>Study each image carefully to identify AI-generated ones</li>
            <li>Use DECODE command to reveal codes</li>
            <li>Combine codes from AI images in sequence</li>
            <li>Format: DECODE [row] [column]</li>
            <li>Wrong codes add 1 minute penalty!</li>
          </ul>
        </div>
        
        <StageProgress />
      </div>
    </div>
  );
};

export default Sidebar;
