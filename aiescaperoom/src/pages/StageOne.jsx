import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { syncGameState, reportWrongCode } from '../services/api';
import { generateStage1Code } from '../utils/seedGenerator';
import DevResetTrigger from '../components/DevResetTrigger';
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
  const [codeValues, setCodeValues] = useState(['', '', '', '']);
  const [codeError, setCodeError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [seed, setSeed] = useState('');
  const [seedInput, setSeedInput] = useState('');
  const [doorCode, setDoorCode] = useState('');
  const [showCompletionDetails, setShowCompletionDetails] = useState(false);
  const [needSeed, setNeedSeed] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(0); // Track which slot is selected
  
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
      // Clear all flip timeouts
      Object.values(timeoutRefs.current).forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, [location.search]);
  
  // Save game state when important state changes
  useEffect(() => {
    if (seed) {
      storeGameState('stage1', {
        flippedImageIds,
        completed,
        doorCode,
        needSeed
      });
      
      // Store flipped images separately
      storeFlippedImages(flippedImageIds);
      
      // Store processed images separately
      storeProcessedImages(processedImageIds.current);
    }
  }, [flippedImageIds, completed, doorCode, needSeed, seed]);

  useEffect(() => {
    // Add a check for if user is captain and has completed this stage
    const isUserCaptain = localStorage.getItem('ai_escape_is_captain') === 'true';
    
    // When stage is completed and user is captain, redirect to StageFour
    if (completed && isUserCaptain) {
      const captainSeed = localStorage.getItem('ai_escape_captain_seed') || seed;
      navigate(`/stage4?seed=${captainSeed}`);
    }
  }, [completed, navigate, seed]);

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
    } else {
      // Handle invalid seed (outside range)
      alert("Please enter a valid seed between 10000 and 100019");
    }
  };

  // Generate image data based on the seed
  const generateImageData = (seed) => {
    // Use the seed to ensure consistent code positions
    const seedNum = parseInt(seed) || 0;
    const hasCodePositions = [];
    
    // Determine which 4 images will have code digits
    for (let i = 0; i < 4; i++) {
      // Generate a position based on the seed and current index
      const pos = (seedNum + i * 7) % 30 + 1; // 1-30
      hasCodePositions.push(pos);
    }
    
    // Create the image data array with 30 images
    const data = [];
    for (let i = 1; i <= 30; i++) {
      const hasCode = hasCodePositions.includes(i);
      const codeIndex = hasCodePositions.indexOf(i);
      
      // Generate a random number between 0-9 for all images to display
      // AI images have valid code digits, non-AI images have decoy numbers
      const displayNumber = hasCode 
        ? doorCode[codeIndex] 
        : ((seedNum * i) % 10).toString();
      
      data.push({
        id: i,
        hasCode: hasCode,
        isAI: hasCode, // Flag to indicate if it's AI-generated
        code: hasCode ? doorCode[codeIndex] : displayNumber,
        // Using placeholder image URL - you should replace with actual diverse images
        imageUrl: `https://picsum.photos/seed/${seedNum + i}/600/400`
      });
    }
    
    return data;
  };

  const imageData = generateImageData(seed);

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

  // Updated image click handler with improved card flipping
  const handleImageClick = (id) => {
    const isCurrentlyFlipped = flippedImageIds.includes(id);
    
    // If already flipped, flip it back
    if (isCurrentlyFlipped) {
      setFlippedImageIds(prev => prev.filter(imgId => imgId !== id));
      return;
    }
    
    // Flip the card
    setFlippedImageIds(prev => [...prev, id]);
    
    // If image has a code and hasn't been processed before, add it to discovered codes
    const clickedImage = imageData.find(img => img.id === id);
    if (clickedImage && clickedImage.isAI && !processedImageIds.current.has(id)) {
      const updatedCodes = [...discoveredCodes, clickedImage.code];
      setDiscoveredCodes(updatedCodes);
      processedImageIds.current.add(id);
      
      // Add terminal messages
      addTerminalMessage(`AI-GENERATED IMAGE DETECTED: ID #${id}`, "success");
      addTerminalMessage(`CODE FRAGMENT EXTRACTED: [${clickedImage.code}]`, "success");
      
      // Play success sound
      if (successSoundRef.current) {
        successSoundRef.current.currentTime = 0;
        successSoundRef.current.play().catch(err => {});
      }
      
      // Store discovered codes and processed images
      storeDiscoveredCodes(updatedCodes);
      storeProcessedImages(processedImageIds.current);
    } else if (!clickedImage.isAI) {
      // Message for non-AI images
      addTerminalMessage(`IMAGE #${id} ANALYSIS: AUTHENTIC IMAGE - NO CODE DETECTED`, "system");
    }
  };

  const handleCodeEntry = () => {
    setShowCodeEntry(true);
    clearCodeEntry();
  };

  // Add a function to handle numpad clicks
  const handleNumpadClick = (digit) => {
    // Create a copy of the current code values
    const newCodeValues = [...codeValues];
    
    // Update the selected slot with the clicked digit
    newCodeValues[selectedSlot] = digit;
    
    // Update state
    setCodeValues(newCodeValues);
    
    // Move to next empty slot automatically
    if (selectedSlot < 3) {
      const nextSlot = selectedSlot + 1;
      setSelectedSlot(nextSlot);
    }
  };
  
  // Function to handle slot selection
  const handleSlotClick = (index) => {
    setSelectedSlot(index);
  };
  
  // Clear function to reset code entry
  const clearCodeEntry = () => {
    setCodeValues(['', '', '', '']);
    setSelectedSlot(0);
    setCodeError('');
  };

  const handleCodeSubmit = async () => {
    // Check if all slots are filled
    if (codeValues.some(val => val === '')) {
      setCodeError('Please fill all slots with numbers');
      return;
    }
    
    // Check if the entered code matches the door code
    const enteredCode = codeValues.join('');
    if (enteredCode === doorCode) {
      addTerminalMessage("ACCESS CODE VERIFIED - SECURITY OVERRIDE SUCCESSFUL", "success");
      addTerminalMessage("IMAGE SUBSYSTEM BYPASSED - ACCESSING NEXT SECURITY LAYER", "success");
      
      if (successSoundRef.current) {
        successSoundRef.current.play().catch(err => {});
      }
      
      setCodeError('');
      setCompleted(true);
      setShowCodeEntry(false);
      await syncGameState('stage1-completed');
      
      // Mark stage as complete
      markStageComplete(1);
    } else {
      addTerminalMessage("INVALID ACCESS CODE - SECURITY ALERT TRIGGERED", "error");
      addTerminalMessage("SYSTEM LOCKOUT THREATENED - RETRY WITH CORRECT SEQUENCE", "warning");
      
      setCodeError('Incorrect code. Try again!');
      await reportWrongCode();
      // Reset the code slots
      setCodeValues(['', '', '', '']);
    }
  };

  const toggleCompletionDetails = () => {
    setShowCompletionDetails(!showCompletionDetails);
  };

  const handleReturnToRoleSelection = () => {
    navigate('/');
  };

  // Add this effect to auto-validate the code when all slots are filled
  useEffect(() => {
    // If all code slots are filled, automatically try to submit the code
    if (codeValues.every(val => val !== '') && showCodeEntry) {
      handleCodeSubmit();
    }
  }, [codeValues]);

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
                <p>You've infiltrated Dr. Finkelstein's classified image database. Some images contain embedded access codes.</p>
                <p>OBJECTIVE: Identify all AI-generated images to extract the 4-digit access code.</p>
                <p>WARNING: System will detect tampering if incorrect code is entered.</p>
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
                <button 
                  className="override-button" 
                  onClick={handleCodeEntry}
                  disabled={discoveredCodes.length < 4}
                >
                  ENTER SECURITY OVERRIDE
                </button>
              </div>
              
              {/* Image database with lab scanner theme */}
              <div className="security-section fullscreen-grid">
                <h3>CLASSIFIED IMAGE SCANNER</h3>
                <div className="image-grid two-column">
                  {imageData.map((image) => (
                    <div 
                      key={image.id} 
                      className={`scanner-image ${flippedImageIds.includes(image.id) ? 'flipped' : ''} ${image.isAI ? 'ai-generated' : ''}`}
                      onClick={() => handleImageClick(image.id)}
                    >
                      <div className="card-inner">
                        <div className="card-front">
                          <div className="image-container">
                            <img src={image.imageUrl} alt={`Classified Image ${image.id}`} />
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
                              {image.isAI ? 
                                <span className="ai-tag">AI-GENERATED</span> : 
                                <span className="real-tag">AUTHENTIC</span>
                              }
                            </div>
                            <div className="result-content">
                              <div className="number-display">
                                <span className="number-label">EXTRACTED NUMBER:</span>
                                <span className={`displayed-number ${image.isAI ? 'valid-number' : 'invalid-number'}`}>
                                  {image.code}
                                </span>
                                {image.isAI ? (
                                  <div className="code-detected">CODE FRAGMENT CONFIRMED</div>
                                ) : (
                                  <div className="no-code">INVALID CODE FRAGMENT</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Security override terminal */}
            {showCodeEntry && (
              <div className="code-entry-overlay">
                <div className="override-terminal">
                  <h3 className="override-header">SECURITY OVERRIDE TERMINAL</h3>
                  <p className="terminal-text">ENTER 4-DIGIT ACCESS CODE:</p>
                  
                  <div className="code-slots">
                    {codeValues.map((value, index) => (
                      <CodeSlot 
                        key={index} 
                        value={value} 
                        isSelected={selectedSlot === index}
                        onClick={() => handleSlotClick(index)} 
                      />
                    ))}
                  </div>
                  
                  <div className="numpad">
                    <div className="numpad-row">
                      <NumpadButton digit="1" onClick={handleNumpadClick} />
                      <NumpadButton digit="2" onClick={handleNumpadClick} />
                      <NumpadButton digit="3" onClick={handleNumpadClick} />
                    </div>
                    <div className="numpad-row">
                      <NumpadButton digit="4" onClick={handleNumpadClick} />
                      <NumpadButton digit="5" onClick={handleNumpadClick} />
                      <NumpadButton digit="6" onClick={handleNumpadClick} />
                    </div>
                    <div className="numpad-row">
                      <NumpadButton digit="7" onClick={handleNumpadClick} />
                      <NumpadButton digit="8" onClick={handleNumpadClick} />
                      <NumpadButton digit="9" onClick={handleNumpadClick} />
                    </div>
                    <div className="numpad-row">
                      <button className="numpad-clear" onClick={clearCodeEntry}>Clear</button>
                      <NumpadButton digit="0" onClick={handleNumpadClick} />
                      <button className="numpad-delete" onClick={() => {
                        const newCodeValues = [...codeValues];
                        newCodeValues[selectedSlot] = '';
                        setCodeValues(newCodeValues);
                      }}>Del</button>
                    </div>
                  </div>
                  
                  {codeError && <p className="override-error">{codeError}</p>}
                  
                  <div className="terminal-buttons">
                    <button className="cancel-button" onClick={() => setShowCodeEntry(false)}>ABORT</button>
                    <button className="execute-button" onClick={handleCodeSubmit}>EXECUTE OVERRIDE</button>
                  </div>
                </div>
              </div>
            )}
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
    </div>
  );
};

export default StageOne;
