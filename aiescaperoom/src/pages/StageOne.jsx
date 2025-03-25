import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { syncGameState, reportWrongCode } from '../services/api';
import { generateStage1Code } from '../utils/seedGenerator';
import DevResetTrigger from '../components/DevResetTrigger';
import imagesData from '../data/images.json';
import { 
  storeSeed, 
  getSeed, 
  storeDiscoveredCodes, 
  getDiscoveredCodes,
  markStageComplete,
  isStageComplete,
  storeFlippedImages,
  getFlippedImages,
  storeProcessedImages,
  getProcessedImages,
  storeGameState,
  getGameState
} from '../utils/gameState';
import '../styles/StageOne.css';
import DebugPanel from '../components/DebugPanel';

// Detect touch device
const isTouchDevice = () => {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
};

// Simple CodeSlot component
const CodeSlot = ({ value, isSelected, onClick }) => {
  return (
    <div 
      className={`code-slot ${isSelected ? 'selected' : ''} ${value ? 'filled' : ''}`}
      onClick={onClick}
    >
      {value || ''}
    </div>
  );
};

// Numpad Button component
const NumpadButton = ({ digit, onClick, disabled }) => {
  return (
    <button 
      className="numpad-button" 
      onClick={() => onClick(digit)}
      disabled={disabled}
    >
      {digit}
    </button>
  );
};

const StageOne = () => {
  const [flippedImageIds, setFlippedImageIds] = useState([]);
  const [discoveredCodes, setDiscoveredCodes] = useState([]);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [seed, setSeed] = useState('');
  const [seedInput, setSeedInput] = useState('');
  const [doorCode, setDoorCode] = useState('');
  const [showCompletionDetails, setShowCompletionDetails] = useState(false);
  const [needSeed, setNeedSeed] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(0); // Track which slot is selected
  
  // Challenge mechanics states
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(4); // Start with 4 attempts
  const [gameImages, setGameImages] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [disabledImages, setDisabledImages] = useState([]);
  const [imageLoadError, setImageLoadError] = useState(false);
  
  const timeoutRefs = useRef({});
  const processedImageIds = useRef(new Set());
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add terminal-related state and refs
  const [terminalMessages, setTerminalMessages] = useState([
    { text: "> SECURITY BREACH INITIATED", type: "error" },
    { text: "> ACCESSING IMAGE DATABASE...", type: "system" },
    { text: "> DR. FINKELSTEIN'S CLASSIFIED VISUALS DETECTED", type: "system" },
    { text: "> WARNING: IDENTIFY AI-GENERATED SECURITY IMAGES TO EXTRACT ACCESS CODES", type: "warning" }
  ]);
  
  const terminalRef = useRef(null);
  const typingSoundRef = useRef(null);
  const successSoundRef = useRef(null);
  const timerRef = useRef(null);
  const errorSoundRef = useRef(null);
  
  // Get seed from URL query parameters or local storage
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const seedParam = params.get('seed');
    const savedSeed = getSeed();
    
    // Load saved game state if exists
    const savedState = getGameState('stage1');
    if (savedState) {
      if (savedState.flippedImageIds) setFlippedImageIds(savedState.flippedImageIds);
      if (savedState.completed) setCompleted(savedState.completed);
      if (savedState.doorCode) setDoorCode(savedState.doorCode);
      if (savedState.needSeed !== undefined) setNeedSeed(savedState.needSeed);
      if (savedState.attemptsLeft) setAttemptsLeft(savedState.attemptsLeft);
    }
    
    if (seedParam) {
      handleSeedSubmit(seedParam);
    } else if (savedSeed) {
      handleSeedSubmit(savedSeed);
    }
    
    // Load previously discovered codes
    const savedCodes = getDiscoveredCodes();
    if (savedCodes.length > 0) {
      setDiscoveredCodes(savedCodes);
    }
    
    // Load processed image IDs
    const savedProcessedImages = getProcessedImages();
    if (savedProcessedImages.size > 0) {
      processedImageIds.current = savedProcessedImages;
    }
    
    // Check if already completed
    if (isStageComplete(1)) {
      setCompleted(true);
    }
    
    return () => {
      // Clear all timers on unmount
      Object.values(timeoutRefs.current).forEach(timeoutId => clearTimeout(timeoutId));
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [location.search]);
  
  // Save game state when important state changes
  useEffect(() => {
    if (seed) {
      storeGameState('stage1', {
        flippedImageIds,
        completed,
        doorCode,
        needSeed,
        attemptsLeft,
        discoveredCodes
      });
      
      // Store flipped images separately
      storeFlippedImages(flippedImageIds);
      
      // Store processed images separately
      storeProcessedImages(processedImageIds.current);
      
      // Store discovered codes separately
      storeDiscoveredCodes(discoveredCodes);
    }
  }, [flippedImageIds, completed, doorCode, needSeed, seed, attemptsLeft, discoveredCodes]);

  // Redirect captain to Stage 4 when completed
  useEffect(() => {
    // Add a check for if user is captain and has completed this stage
    const isUserCaptain = localStorage.getItem('ai_escape_is_captain') === 'true';
    
    // When stage is completed and user is captain, redirect to StageFour
    if (completed && isUserCaptain) {
      const captainSeed = localStorage.getItem('ai_escape_captain_seed') || seed;
      navigate(`/stage4?seed=${captainSeed}`);
    }
  }, [completed, navigate, seed]);

  // Make sure images are loaded when seed is set
  useEffect(() => {
    if (seed && gameImages.length === 0) {
      console.log("Initializing game images with seed:", seed, "and doorCode:", doorCode);
      generateGameImages(seed);
    }
  }, [seed, doorCode, gameImages.length]);

  // Timer effect - manages the 60-second countdown
  useEffect(() => {
    if (timerActive && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimerExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerActive, timer]);

  // Update audio handling to include error handling
  useEffect(() => {
    // Set up audio error handling
    const audioElements = [typingSoundRef.current, successSoundRef.current, errorSoundRef.current];
    
    audioElements.forEach(audio => {
      if (audio) {
        audio.addEventListener('error', (e) => {
          console.error(`Audio error: ${e.target.src}`, e);
          // Continue without audio rather than breaking the game
        });
      }
    });
    
    return () => {
      audioElements.forEach(audio => {
        if (audio) {
          audio.removeEventListener('error', () => {});
        }
      });
    };
  }, []);

  const handleSeedSubmit = (inputSeed) => {
    const seedValue = inputSeed || seedInput;
    const seedNum = parseInt(seedValue);
    
    if (seedValue.length === 5 && /^\d+$/.test(seedValue) && 
        seedNum >= 10000 && seedNum <= 100019) {
      setSeed(seedValue);
      setNeedSeed(false);
      // Generate the door code based on the seed
      const generatedCode = generateStage1Code(seedValue);
      setDoorCode(generatedCode);
      
      // Store the seed
      storeSeed(seedValue);
      
      // Update URL with seed parameter
      if (!inputSeed) {
        const url = new URL(window.location);
        url.searchParams.set('seed', seedValue);
        window.history.pushState({}, '', url);
      }
      
      // Generate initial game images
      generateGameImages(seedValue);
      
      // Set initial attempts
      setAttemptsLeft(4);
    } else {
      // Handle invalid seed (outside range)
      alert("Please enter a valid seed between 10000 and 100019");
    }
  };

  // Generate game images from the image data based on seed
  const generateGameImages = (seedValue) => {
    try {
      const seedNum = parseInt(seedValue) || 0;
      console.log("Generating game images with seed:", seedNum);
      
      // Make sure imagesData is available
      if (!imagesData || !imagesData.images || !imagesData.images.length) {
        console.error("Images data is not available", imagesData);
        setImageLoadError(true);
        return;
      }
      
      const allImages = [...imagesData.images];
      const aiImages = allImages.filter(img => img.isAI);
      const normalImages = allImages.filter(img => !img.isAI);
      
      if (aiImages.length < 4) {
        console.error("Not enough AI images available", aiImages);
        setImageLoadError(true);
        return;
      }
      
      // Deterministically select 4 AI images based on seed
      const selectedAiImages = [];
      for (let i = 0; i < 4; i++) {
        const index = (seedNum + i * 7) % aiImages.length;
        const codeIndex = i % 4; // ensure we use only 0-3 indexes
        const codeDigit = doorCode ? doorCode[codeIndex] : ((seedNum + i * 3) % 10).toString();
        
        selectedAiImages.push({
          ...aiImages[index],
          code: codeDigit,
          isAI: true
        });
      }
      
      // Select non-AI images to fill the remaining slots (up to 30 total)
      const shuffledNormalImages = [...normalImages].sort(() => 0.5 - Math.random());
      const selectedNormalImages = shuffledNormalImages.slice(0, 26).map(img => ({
        ...img,
        code: ((seedNum + parseInt(img.id.replace('img', ''))) % 10).toString(),
        isAI: false
      }));
      
      // Combine all images with better URLs
      const combinedImages = [...selectedAiImages, ...selectedNormalImages].map(img => ({
        ...img,
        // Ensure URLs are absolute and work consistently
        url: img.url.startsWith('http') ? img.url : `https://picsum.photos/id/${img.id.replace('img', '')}/500/500`
      }));
      
      // Shuffle based on seed for deterministic but random-looking order
      const shuffledImages = [...combinedImages].sort((a, b) => {
        const hashA = (seedNum + parseInt(a.id.replace('img', ''))) % 1000;
        const hashB = (seedNum + parseInt(b.id.replace('img', ''))) % 1000;
        return hashA - hashB;
      });
      
      console.log("Generated", shuffledImages.length, "game images");
      setGameImages(shuffledImages);
    } catch (err) {
      console.error("Error generating game images:", err);
      setImageLoadError(true);
    }
  };
  
  // Regenerate images (for when attempts run out)
  const regenerateGameImages = () => {
    // Use a different "seed" variation to get a different arrangement
    const variantSeed = seed + '_' + Date.now();
    generateGameImages(variantSeed);
    setFlippedImageIds([]);
  };
  
  // Handle image click with updated game mechanics
  const handleImageClick = (id) => {
    const isCurrentlyFlipped = flippedImageIds.includes(id);
    
    // If already flipped or disabled, do nothing
    if (isCurrentlyFlipped || disabledImages.includes(id)) {
      return;
    }
    
    // Find the clicked image with better error handling
    const clickedImage = gameImages.find(img => img.id === id);
    if (!clickedImage) {
      console.error("Could not find image with id:", id);
      return;
    }
    
    // Flip the card
    setFlippedImageIds(prev => [...prev, id]);
    
    // Clear any existing timers to prevent race conditions
    if (clickedImage.isAI && timerActive) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setTimerActive(false);
      setTimer(0);
    }
    
    if (clickedImage.isAI) {
      // Handle AI image click
      handleAiImageClick(clickedImage);
    } else {
      // Handle non-AI image click
      handleNonAiImageClick(clickedImage);
    }
  };
  
  // Handle AI image click
  const handleAiImageClick = (image) => {
    // Check if we already processed this image
    if (processedImageIds.current.has(image.id)) {
      addTerminalMessage(`IMAGE #${image.id} ALREADY ANALYZED`, "system");
      return;
    }
    
    // If timer is active, we found an AI image in time!
    if (timerActive) {
      setTimerActive(false);
      clearInterval(timerRef.current);
      setTimer(0);
      
      addTerminalMessage("AI IMAGE LOCATED SUCCESSFULLY WITHIN TIME LIMIT", "success");
      showTemporaryMessage("AI image located! Timer stopped.");
      
      // Clear disabled images
      setDisabledImages([]);
    }
    
    // Extract the code fragment
    const updatedCodes = [...discoveredCodes, image.code];
    setDiscoveredCodes(updatedCodes);
    processedImageIds.current.add(image.id);
    
    // Terminal feedback
    addTerminalMessage(`AI-GENERATED IMAGE DETECTED: ID #${image.id}`, "success");
    addTerminalMessage(`CODE FRAGMENT EXTRACTED - STORED IN MEMORY BANKS`, "success");
    
    // Check if all 4 fragments are found
    if (updatedCodes.length === 4) {
      addTerminalMessage(`ALL FOUR CODE FRAGMENTS EXTRACTED`, "success");
      addTerminalMessage(`SECURITY OVERRIDE SEQUENCE NOW AVAILABLE`, "warning");
    }
    
    // Play success sound
    if (successSoundRef.current) {
      successSoundRef.current.currentTime = 0;
      successSoundRef.current.play().catch(err => {});
    }
    
    // Store discovered codes
    storeDiscoveredCodes(updatedCodes);
    storeProcessedImages(processedImageIds.current);
  };
  
  // Handle non-AI image click
  const handleNonAiImageClick = (image) => {
    // If timer is already active, just add a message
    if (timerActive) {
      addTerminalMessage(`IMAGE #${image.id} ANALYZED - NOT AI GENERATED`, "error");
      return;
    }
    
    // Start the 60-second timer
    setTimer(60);
    setTimerActive(true);
    
    // Disable this image so it can't be clicked again during this challenge
    setDisabledImages([image.id]);
    
    // Terminal feedback
    addTerminalMessage(`INCORRECT IMAGE SELECTED - 60 SECOND TIMER INITIATED`, "warning");
    addTerminalMessage(`LOCATE AN AI-GENERATED IMAGE IMMEDIATELY`, "warning");
    showTemporaryMessage("Non-AI image detected! Find an AI image within 60 seconds.");
    
    // Play error sound
    if (errorSoundRef.current) {
      errorSoundRef.current.currentTime = 0;
      errorSoundRef.current.play().catch(err => {});
    }
  };
  
  // Render timer bar
  const renderTimerBar = () => {
    if (!timerActive) return null;
    
    const percentage = (timer / 60) * 100;
    return (
      <div className="timer-bar">
        <div 
          className={`timer-progress ${percentage < 30 ? 'danger' : ''}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    );
  };
  
  // Render attempts indicator
  const renderAttemptsIndicator = () => {
    if (!timerActive && attemptsLeft === 4) return null;
    
    return (
      <div className="attempts-indicator">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className={`attempt ${i >= attemptsLeft ? 'used' : ''}`}
          />
        ))}
      </div>
    );
  };
  
  // Render status message
  const renderStatusMessage = () => {
    if (!showMessage) return null;
    
    return (
      <div className={`message-overlay ${showMessage ? 'visible' : ''}`}>
        {statusMessage}
      </div>
    );
  };
  
  // Add terminal message effect
  const addTerminalMessage = (message, type = "system") => {
    if (typingSoundRef.current) {
      typingSoundRef.current.currentTime = 0;
      typingSoundRef.current.play().catch(err => {});
    }
    
    setTerminalMessages(prev => [...prev, { text: `> ${message}`, type }]);
    
    // Scroll terminal to bottom
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 100);
  };
  
  // Show temporary message overlay
  const showTemporaryMessage = (message) => {
    setStatusMessage(message);
    setShowMessage(true);
    
    setTimeout(() => {
      setShowMessage(false);
    }, 2000);
  };
  
  // Handle timer expiration
  const handleTimerExpired = () => {
    setTimerActive(false);
    
    // Reduce attempts
    setAttemptsLeft(prev => {
      const newAttempts = prev - 1;
      
      if (newAttempts <= 0) {
        // No attempts left, reset and regenerate
        showTemporaryMessage("All attempts used! Shuffling images and resetting progress...");
        addTerminalMessage("SECURITY SYSTEM RECONFIGURING - ALL ATTEMPTS EXPENDED", "error");
        addTerminalMessage("RESETTING CODE FRAGMENTS - SCANNING FOR NEW PATTERNS", "warning");
        
        // Reset discovered codes
        setDiscoveredCodes([]);
        processedImageIds.current = new Set();
        storeDiscoveredCodes([]);
        storeProcessedImages(new Set());
        
        // Reset attempts and regenerate images
        setTimeout(() => {
          regenerateGameImages();
          setAttemptsLeft(4);
          setDisabledImages([]);
        }, 2000);
        
        return 0;
      } else {
        // Still have attempts left
        addTerminalMessage(`TIME EXPIRED - ${newAttempts} ATTEMPT${newAttempts !== 1 ? 'S' : ''} REMAINING`, "warning");
        showTemporaryMessage(`Time expired! ${newAttempts} attempt${newAttempts !== 1 ? 's' : ''} remaining`);
        setDisabledImages([]);
        return newAttempts;
      }
    });
  };
  
  // New handler for the inline code input
  const handleCodeInputChange = (e) => {
    setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 4));
    setCodeError('');
  };

  // New handler for code submission directly from the inline input
  const handleInlineCodeSubmit = async () => {
    addTerminalMessage("VERIFYING ACCESS CODE...", "system");
    
    if (enteredCode === doorCode) {
      addTerminalMessage("ACCESS CODE VERIFIED - SECURITY OVERRIDE SUCCESSFUL", "success");
      addTerminalMessage("IMAGE SUBSYSTEM BYPASSED - ACCESSING NEXT SECURITY LAYER", "success");
      
      if (successSoundRef.current) {
        successSoundRef.current.play().catch(err => {});
      }
      
      setCodeError('');
      setCompleted(true);
      await syncGameState('stage1-completed');
      
      // Mark stage as complete
      markStageComplete(1);
    } else {
      addTerminalMessage("INVALID ACCESS CODE - SECURITY ALERT TRIGGERED", "error");
      addTerminalMessage("SYSTEM LOCKOUT THREATENED - RETRY WITH CORRECT SEQUENCE", "warning");
      
      setCodeError('Incorrect code. Try again!');
      await reportWrongCode();
      // Reset the code input
      setEnteredCode('');
    }
  };

  const toggleCompletionDetails = () => {
    setShowCompletionDetails(!showCompletionDetails);
  };

  const handleReturnToRoleSelection = () => {
    navigate('/');
  };

  // Debug state for the debug panel
  const debugState = {
    seed,
    doorCode,
    imagesLoaded: gameImages.length > 0,
    aiCount: gameImages.filter(img => img?.isAI).length || 0,
    discoveredCount: discoveredCodes.length,
    timerActive,
    attemptsLeft,
    error: imageLoadError ? "Image loading error" : null
  };
  
  // Seed entry screen
  if (needSeed) {
    return (
      <div className="stage-container paper-bg">
        <div className="seed-entry-container">
          <h1>Enter Team Seed</h1>
          <p>Ask your team captain for the 5-digit seed to begin your challenge.</p>
          
          <div className="seed-input-group">
            <input
              type="text"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="Enter 5-digit seed"
              maxLength="5"
              pattern="\d{5}"
            />
            <button 
              className="seed-submit-button" 
              onClick={() => handleSeedSubmit()}
              disabled={seedInput.length !== 5}
            >
              Start Challenge
            </button>
          </div>
        </div>
        <DevResetTrigger />
      </div>
    );
  }

  return (
    <div className="stage-container paper-bg lab-theme">
      <audio ref={typingSoundRef} src="/sounds/typing.mp3" />
      <audio ref={successSoundRef} src="/sounds/success.mp3" />
      <audio ref={errorSoundRef} src="/sounds/error.mp3" />
      
      {/* Render error message if image loading fails */}
      {imageLoadError && (
        <div className="error-message" style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,0,0,0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '5px',
          zIndex: 1000
        }}>
          Error loading images. Please refresh the page.
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'block',
              margin: '10px auto 0',
              padding: '5px 10px',
              background: 'white',
              color: 'black',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
      )}
      
      {/* Game status elements */}
      {renderTimerBar()}
      {renderAttemptsIndicator()}
      {renderStatusMessage()}
      
      <div className="security-hud">
        <div className="facility-section">
          <span>FACILITY SECTION:</span> IMAGE DATABASE
        </div>
        
        <div className="seed-badge">
          LAB ID: <strong>{seed}</strong>
        </div>
      </div>
      
      <div className="stage-content lab-terminal">
        <div className="stage-header">
          <h1>DR. FINKELSTEIN'S IMAGE DATABASE</h1>
        </div>
        
        {!completed ? (
          <div className="lab-container">
            <div className="lab-interface">
              <div className="security-terminal" ref={terminalRef}>
                {terminalMessages.map((msg, idx) => (
                  <div key={idx} className={`terminal-line ${msg.type}`}>
                    {msg.text}
                  </div>
                ))}
              </div>
              
              {/* Instructions with lab theme */}
              <div className="lab-instructions">
                <h3>SECURITY BREACH PROTOCOL</h3>
                <p>You've infiltrated Dr. Finkelstein's classified image database. Each image contains a code digit.</p>
                <p>OBJECTIVE: Identify AI-generated images to extract the 4-digit access code.</p>
                <p>WARNING: If you select a non-AI image, you have 60 seconds to find a real AI image. You have 4 attempts.</p>
              </div>
              
              {/* Always visible code entry interface */}
              <div className="inline-code-entry">
                <h3>SECURITY OVERRIDE INPUT</h3>
                <div className="code-entry-container">
                  <div className="code-entry-terminal">
                    <p className="terminal-text">ENTER 4-DIGIT SECURITY OVERRIDE CODE</p>
                    
                    <div className="override-input-container">
                      <input
                        type="text"
                        value={enteredCode}
                        onChange={handleCodeInputChange}
                        maxLength="4"
                        placeholder="0000"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        className="override-input"
                        autoFocus
                      />
                    </div>
                    
                    {codeError && <p className="override-error">{codeError}</p>}
                    
                    <button 
                      className="execute-button"
                      onClick={handleInlineCodeSubmit}
                      disabled={enteredCode.length !== 4}
                    >
                      EXECUTE OVERRIDE
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Discovered codes section */}
              <div className="extracted-fragments">
                <h3>EXTRACTED CODE FRAGMENTS</h3>
                <div className="fragment-grid">
                  {discoveredCodes.length > 0 ? 
                    discoveredCodes.map((code, index) => (
                      <div key={index} className="code-fragment found">
                        <div className="fragment-label">CODE-{index + 1}</div>
                        <div className="fragment-value">{code}</div>
                      </div>
                    )) : 
                    <div className="no-fragments">NO CODE FRAGMENTS DETECTED</div>
                  }
                </div>
              </div>
              
              {/* Image database with lab scanner theme */}
              <div className="security-section">
                <h3>CLASSIFIED IMAGE SCANNER</h3>
                <div className="image-grid">
                  {gameImages && gameImages.length > 0 ? (
                    gameImages.map((image) => (
                      <div 
                        key={image.id} 
                        className={`scanner-image ${flippedImageIds.includes(image.id) ? 'flipped' : ''} ${disabledImages.includes(image.id) ? 'disabled' : ''}`}
                        onClick={() => handleImageClick(image.id)}
                      >
                        <div className="card-inner">
                          <div className="card-front">
                            <div className="image-container">
                              <img 
                                src={image.url} 
                                alt={`Classified Image ${image.id}`}
                                onError={(e) => {
                                  console.error("Image failed to load:", image.url);
                                  e.target.src = "https://via.placeholder.com/500?text=Image+Not+Found";
                                }}
                              />
                              <div className="image-interface">
                                <div className="image-id">ID-{image.id}</div>
                                <div className="scan-button">ANALYZE</div>
                              </div>
                            </div>
                          </div>
                          <div className="card-back">
                            <div className="analysis-result">
                              <div className="result-header">
                                <span>IMAGE #{image.id}</span>
                              </div>
                              <div className="result-content">
                                <div className="code-value">{image.code}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="loading-message">
                      {imageLoadError ? "Error loading images. Please refresh." : "Loading image database... Please wait."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="escape-success">
            <h2>IMAGE DATABASE BYPASSED</h2>
            <div className="success-animation"></div>
            <p>You've successfully compromised Dr. Finkelstein's image database and extracted the security codes.</p>
            
            <div className="completion-details">
              <button className="data-button" onClick={toggleCompletionDetails}>
                {showCompletionDetails ? 'HIDE DATA' : 'ACCESS SECURITY DATA'}
              </button>
              
              {showCompletionDetails && (
                <div className="data-panel">
                  <div className="data-item">
                    <span>LAB ID:</span>
                    <strong>{seed}</strong>
                  </div>
                  <div className="data-item">
                    <span>ACCESS CODE:</span>
                    <strong>{doorCode}</strong>
                  </div>
                  <p className="data-note">Transmit this information to your team's Captain.</p>
                </div>
              )}
            </div>
            
            <button className="exit-button" onClick={handleReturnToRoleSelection}>
              RETURN TO COMMAND CENTER
            </button>
          </div>
        )}
      </div>
      <DevResetTrigger />
      <DebugPanel gameState={debugState} />
    </div>
  );
};

export default StageOne;
