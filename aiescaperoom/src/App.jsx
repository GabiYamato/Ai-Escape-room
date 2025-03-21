import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import SplashScreen from './pages/SplashScreen'
import GameScreen from './pages/GameScreen'
import StageTwo from './pages/StageTwo'
import DebugInfo from './components/DebugInfo'
import { initGameState, syncGameState } from './services/api'
import './App.css'

function App() {
  const [timer, setTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Initialize game state from server
  useEffect(() => {
    const initGame = async () => {
      setIsLoading(true);
      try {
        const gameState = await initGameState();
        setTimer(gameState.timer || 0);
        
        // If the route doesn't match the game state, redirect
        const currentStage = location.pathname.substring(1) || 'splash';
        if (gameState.stage && gameState.stage !== currentStage) {
          const route = gameState.stage === 'splash' ? '/' : `/${gameState.stage}`;
          navigate(route, { replace: true });
        }
      } catch (error) {
        console.error('Failed to initialize game state:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initGame();
  }, [navigate, location.pathname]);
  
  // Show loading screen while initializing
  if (isLoading) {
    return <div className="loading-screen">Loading game state...</div>;
  }
  
  return (
    <>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/game" element={<GameScreen timer={timer} setTimer={setTimer} />} />
        <Route path="/stage2" element={<StageTwo timer={timer} />} />
      </Routes>
      <DebugInfo />
    </>
  )
}

export default App
