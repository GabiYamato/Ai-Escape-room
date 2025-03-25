import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import SplashScreen from './pages/SplashScreen'
import RoleSelection from './pages/RoleSelection'
import StageOne from './pages/StageOne'
import StageTwo from './pages/StageTwo'
import StageThree from './pages/StageThree'
import StageFour from './pages/StageFour'
import GameScreen from './pages/GameScreen'
import DevReset from './components/DevReset'
import { setupGlobalErrorHandling } from './utils/errorTracker'
import './App.css'

function App() {
  const [showDevReset, setShowDevReset] = useState(false);
  // Removed timer state
  
  // Add reload warning
  useEffect(() => {
    window.addEventListener('beforeunload', (e) => {
      e.preventDefault();
      const message = 'Are you sure you want to leave? Your progress will be lost.';
      e.returnValue = message;
      return message;
    });
    
    return () => {
      window.removeEventListener('beforeunload', () => {});
    };
  }, []);

  // Dev reset keyboard shortcut - press Ctrl+Shift+D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDevReset(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Set up global error tracking
  useEffect(() => {
    setupGlobalErrorHandling();
  }, []);

  return (
    <>
      {showDevReset && <DevReset onClose={() => setShowDevReset(false)} />}
      
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        {/* Removed timer prop */}
        <Route path="/game" element={<GameScreen />} />
        {/* Main game stages */}
        <Route path="/stage1" element={<StageOne />} />
        {/* Removed timer prop */}
        <Route path="/stage2" element={<StageTwo />} />
        <Route path="/stage3" element={<StageThree />} />
        <Route path="/stage4" element={<StageFour />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default App
