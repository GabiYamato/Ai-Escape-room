import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MorseCodeSheet from '../components/MorseCodeSheet';
import { syncGameState, reportWrongCode } from '../services/api';
import { generateStage2Phrase } from '../utils/seedGenerator';
import '../styles/StageTwo.css';
import DevResetTrigger from '../components/DevResetTrigger';

const StageTwo = () => {
  const [showSecretDialog, setShowSecretDialog] = useState(false);
  const [secretPhrase, setSecretPhrase] = useState('');
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [seed, setSeed] = useState('');
  const [seedInput, setSeedInput] = useState('');
  const [needSeed, setNeedSeed] = useState(true);
  const [correctPhrase, setCorrectPhrase] = useState('');
  const [showCompletionDetails, setShowCompletionDetails] = useState(false);
  
  // Add penalty time counter since we removed the global timer
  const [penaltyTime, setPenaltyTime] = useState(0);
  
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Add terminal-related state and refs
  const [terminalMessages, setTerminalMessages] = useState([
    { text: "> SECURITY BREACH INITIATED", type: "error" },
    { text: "> INTERCEPTING RADIO COMMUNICATIONS...", type: "system" },
    { text: "> DR. FINKELSTEIN'S ENCRYPTED TRANSMISSIONS DETECTED", type: "system" },
    { text: "> WARNING: DECODE MORSE SIGNALS TO ACCESS SECURITY PHRASES", type: "warning" }
  ]);
  
  const terminalRef = useRef(null);
  const typingSoundRef = useRef(null);
  const successSoundRef = useRef(null);
  
  // Get seed from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const seedParam = params.get('seed');
    if (seedParam) {
      handleSeedSubmit(seedParam);
    }
    
    // Removed the timer increment code that was here
  }, [location.search]);

  const handleSeedSubmit = (inputSeed) => {
    const seedValue = inputSeed || seedInput;
    const seedNum = parseInt(seedValue);
    
    if (seedValue.length === 5 && /^\d+$/.test(seedValue) && 
        seedNum >= 10000 && seedNum <= 100019) {
      setSeed(seedValue);
      setNeedSeed(false);
      // Generate the correct phrase based on the seed
      const generatedPhrase = generateStage2Phrase(seedValue);
      setCorrectPhrase(generatedPhrase);
      
      // Update URL with seed parameter
      if (!inputSeed) {
        const url = new URL(window.location);
        url.searchParams.set('seed', seedValue);
        window.history.pushState({}, '', url);
      }
    } else {
      // Handle invalid seed
      alert("Please enter a valid seed between 10000 and 100019");
    }
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

  // Make sure audio file exists in the public folder
  const audioSrc = "/morse-code.wav";

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.error("Error playing audio:", err);
        addTerminalMessage("ERROR: AUDIO TRANSMISSION CORRUPTED", "error");
      });
      addTerminalMessage("PLAYING INTERCEPTED TRANSMISSION", "system");
    }
  };

  const handleEnterSecret = () => {
    setShowSecretDialog(true);
    setError('');
    addTerminalMessage("SECURITY PHRASE DECODING INTERFACE ACTIVATED", "system");
  };

  const handleSubmitSecret = async () => {
    addTerminalMessage("VERIFYING DECODED PHRASE...", "system");
    
    const normalizedInput = secretPhrase.toLowerCase().trim();
    const normalizedCorrect = correctPhrase.toLowerCase().trim();
    
    if (normalizedInput === normalizedCorrect) {
      if (successSoundRef.current) {
        successSoundRef.current.play().catch(err => {});
      }
      
      addTerminalMessage("PHRASE MATCH CONFIRMED - ACCESS GRANTED", "success");
      addTerminalMessage("COMMUNICATION SYSTEMS BYPASSED", "success");
      
      setError('');
      setCompleted(true);
      await syncGameState('stage2-completed');
      setShowSecretDialog(false);
    } else {
      // Report wrong code to add penalty
      await reportWrongCode();
      // Update local penalty counter instead of global timer
      setPenaltyTime(prev => prev + 60); // Add 1 minute penalty
      setError('That\'s not right. A 1-minute penalty has been added. Try again!');
      
      addTerminalMessage("PHRASE VERIFICATION FAILED - SECURITY ALERT", "error");
      addTerminalMessage("TIME PENALTY ADDED: 60 SECONDS", "warning");
    }
  };

  const toggleCompletionDetails = () => {
    setShowCompletionDetails(!showCompletionDetails);
  };

  const handleReturnToRoleSelection = () => {
    navigate('/role-selection');
  };

  useEffect(() => {
    // Add a check for if user is captain and has completed this stage
    const isUserCaptain = localStorage.getItem('ai_escape_is_captain') === 'true';
    
    // When stage is completed and user is captain, redirect to StageFour
    if (completed && isUserCaptain) {
      const captainSeed = localStorage.getItem('ai_escape_captain_seed') || seed;
      navigate(`/stage4?seed=${captainSeed}`);
    }
  }, [completed, navigate, seed]);

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
      <audio ref={audioRef} src={audioSrc} />
      <audio ref={typingSoundRef} src="/sounds/typing.mp3" />
      <audio ref={successSoundRef} src="/sounds/success.mp3" />
      
      <div className="security-hud">
        <div className="facility-section">
          <span>FACILITY SECTION:</span> COMMUNICATION CENTER
        </div>
        
        {penaltyTime > 0 && (
          <div className="penalty-display">
            PENALTY TIME: {Math.floor(penaltyTime / 60)}m {penaltyTime % 60}s
          </div>
        )}
        
        <div className="seed-badge">
          LAB ID: <strong>{seed}</strong>
        </div>
      </div>
      
      <div className="stage-content lab-terminal">
        <div className="stage-header">
          <h1>DR. FINKELSTEIN'S COMMUNICATION SYSTEM</h1>
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
                <p>You've intercepted an encrypted radio transmission from Dr. Finkelstein's laboratory.</p>
                <p>OBJECTIVE: Decode the Morse code message to extract the security phrase that will disable the communications system.</p>
                <p>WARNING: System will add time penalties for incorrect phrase attempts.</p>
              </div>
              
              {/* Radio transmission interface */}
              <div className="transmission-interface">
                <h3>INTERCEPTED RADIO TRANSMISSION</h3>
                <div className="radio-controls">
                  <div className="transmission-visual">
                    <div className="waveform-display">
                      <div className="waveform-line"></div>
                      <div className="waveform-line"></div>
                      <div className="waveform-line"></div>
                    </div>
                    <div className="frequency-display">FREQ: 121.5 MHz</div>
                  </div>
                  
                  <div className="audio-player">
                    <audio ref={audioRef} src={audioSrc} controls className="transmission-audio" />
                    <button className="play-button" onClick={playAudio}>
                      <span className="play-icon">▶</span> PLAY TRANSMISSION
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Decoder interface */}
              <div className="decoder-section">
                <div className="decoder-tools">
                  <h3>MORSE CODE DECODER</h3>
                  <div className="morse-reference-container">
                    <MorseCodeSheet />
                  </div>
                </div>
                
                <div className="decode-action">
                  <button className="decode-button" onClick={handleEnterSecret}>
                    ENTER DECODED PHRASE
                  </button>
                </div>
              </div>
            </div>
            
            {/* Security phrase dialog */}
            {showSecretDialog && (
              <div className="code-entry-overlay">
                <div className="override-terminal">
                  <h3 className="override-header">SECURITY PHRASE VERIFICATION</h3>
                  <p className="terminal-text">ENTER THE DECODED PHRASE:</p>
                  
                  <input
                    type="text"
                    value={secretPhrase}
                    onChange={(e) => setSecretPhrase(e.target.value)}
                    placeholder="Type the secret phrase here"
                    className="phrase-input"
                    autoFocus
                  />
                  
                  {error && <p className="override-error">{error}</p>}
                  
                  <div className="terminal-buttons">
                    <button className="cancel-button" onClick={() => setShowSecretDialog(false)}>ABORT</button>
                    <button className="execute-button" onClick={handleSubmitSecret}>VERIFY PHRASE</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="escape-success">
            <h2>COMMUNICATION SYSTEM BYPASSED</h2>
            <div className="success-animation"></div>
            <p>You've successfully decoded Dr. Finkelstein's transmission and bypassed the communications security system.</p>
            
            <div className="completion-details">
              <button className="data-button" onClick={toggleCompletionDetails}>
                {showCompletionDetails ? 'HIDE DETAILS' : 'ACCESS SECURITY DATA'}
              </button>
              
              {showCompletionDetails && (
                <div className="data-panel">
                  <div className="data-item">
                    <span>LAB ID:</span>
                    <strong>{seed}</strong>
                  </div>
                  <div className="data-item">
                    <span>SECRET PHRASE:</span>
                    <strong>"{correctPhrase}"</strong>
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

export default StageTwo;
