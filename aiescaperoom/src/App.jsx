import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import SplashScreen from './pages/SplashScreen'
import RoleSelection from './pages/RoleSelection'
import StageOne from './pages/StageOne'
import StageTwo from './pages/StageTwo'
import StageThree from './pages/StageThree'
import StageFour from './pages/StageFour'
import DevReset from './components/DevReset'
import './App.css'

function App() {
  const [showDevReset, setShowDevReset] = useState(false);
  
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

  return (
    <>
      {showDevReset && <DevReset onClose={() => setShowDevReset(false)} />}
      
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/stage1" element={<StageOne />} />
        <Route path="/stage2" element={<StageTwo />} />
        <Route path="/stage3" element={<StageThree />} />
        <Route path="/stage4" element={<StageFour />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default App
