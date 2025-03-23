import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { syncGameState } from '../services/api';
import { generateStage1Code, generateStage3Code, generateStage2Phrase, isValidSeed } from '../utils/seedGenerator';
import '../styles/StageFour.css';
import DevResetTrigger from '../components/DevResetTrigger';

const StageFour = () => {
  const [completed, setCompleted] = useState(false);
  const [stage1Seed, setStage1Seed] = useState('');
  const [stage1Code, setStage1Code] = useState('');
  const [stage2Seed, setStage2Seed] = useState('');
  const [stage2Phrase, setStage2Phrase] = useState('');
  const [stage3Seed, setStage3Seed] = useState('');
  const [stage3Code, setStage3Code] = useState('');
  const [errors, setErrors] = useState({});
  const [seed, setSeed] = useState('');
  const [seedInput, setSeedInput] = useState('');
  const [needSeed, setNeedSeed] = useState(true);
  const [captainChallenge, setCaptainChallenge] = useState({
    completed: false,
    enteredCode: '',
    codeError: ''
  });
  const [hasCompletedChallenge, setHasCompletedChallenge] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get seed from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const seedParam = params.get('seed');
    if (seedParam) {
      handleSeedSubmit(seedParam);
    }
  }, [location.search]);

  // Check if user has completed their challenge as captain
  useEffect(() => {
    const isUserCaptain = localStorage.getItem('ai_escape_is_captain') === 'true';
    
    if (isUserCaptain) {
      // Check if any stage is completed
      const completedStages = JSON.parse(localStorage.getItem('ai_escape_completed_stages') || '[]');
      setHasCompletedChallenge(completedStages.length > 0);
    } else {
      // If not captain, redirect to role selection
      navigate('/');
    }
  }, [navigate]);

  const handleSeedSubmit = (inputSeed) => {
    const seedValue = inputSeed || seedInput;
    const seedNum = parseInt(seedValue);
    
    if (seedValue.length === 5 && /^\d+$/.test(seedValue) && 
        seedNum >= 10000 && seedNum <= 100019) {
      setSeed(seedValue);
      setNeedSeed(false);
      
      // Update URL with seed parameter
      if (!inputSeed) {
        const url = new URL(window.location);
        url.searchParams.set('seed', seedValue);
        window.history.pushState({}, '', url);
      }
      
      // For the Captain's challenge, don't pre-populate other team members' seeds
    } else {
      // Handle invalid seed
      alert("Please enter a valid seed between 10000 and 100019");
    }
  };

  const validateSeed = (seedValue) => {
    return isValidSeed(seedValue);
  };

  const validateInput = (stage) => {
    const newErrors = { ...errors };
    
    if (stage === 1 || stage === 'all') {
      if (!stage1Seed.trim()) {
        newErrors.stage1Seed = 'Seed is required';
      } else if (!/^\d{5}$/.test(stage1Seed.trim())) {
        newErrors.stage1Seed = 'Seed must be 5 digits';
      } else if (!validateSeed(stage1Seed.trim())) {
        newErrors.stage1Seed = 'Seed must be between 10000-10019';
      } else {
        delete newErrors.stage1Seed;
      }
      
      if (!stage1Code.trim()) {
        newErrors.stage1Code = 'Code is required';
      } else if (!/^\d{4}$/.test(stage1Code.trim())) {
        newErrors.stage1Code = 'Code must be 4 digits';
      } else {
        delete newErrors.stage1Code;
      }
    }
    
    if (stage === 2 || stage === 'all') {
      if (!stage2Seed.trim()) {
        newErrors.stage2Seed = 'Seed is required';
      } else if (!/^\d{5}$/.test(stage2Seed.trim())) {
        newErrors.stage2Seed = 'Seed must be 5 digits';
      } else if (!validateSeed(stage2Seed.trim())) {
        newErrors.stage2Seed = 'Seed must be between 10000-10019';
      } else {
        delete newErrors.stage2Seed;
      }
      
      if (!stage2Phrase.trim()) {
        newErrors.stage2Phrase = 'Phrase is required';
      } else {
        delete newErrors.stage2Phrase;
      }
    }
    
    if (stage === 3 || stage === 'all') {
      if (!stage3Seed.trim()) {
        newErrors.stage3Seed = 'Seed is required';
      } else if (!/^\d{5}$/.test(stage3Seed.trim())) {
        newErrors.stage3Seed = 'Seed must be 5 digits';
      } else if (!validateSeed(stage3Seed.trim())) {
        newErrors.stage3Seed = 'Seed must be between 10000-10019';
      } else {
        delete newErrors.stage3Seed;
      }
      
      if (!stage3Code.trim()) {
        newErrors.stage3Code = 'Code is required';
      } else if (!/^\d{4}$/.test(stage3Code.trim())) {
        newErrors.stage3Code = 'Code must be 4 digits';
      } else {
        delete newErrors.stage3Code;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkStage1 = () => {
    if (!validateInput(1)) return false;
    
    const expectedCode = generateStage1Code(stage1Seed);
    return stage1Code === expectedCode;
  };

  const checkStage2 = () => {
    if (!validateInput(2)) return false;
    
    const expectedPhrase = generateStage2Phrase(stage2Seed);
    return stage2Phrase.toLowerCase().trim() === expectedPhrase.toLowerCase();
  };

  const checkStage3 = () => {
    if (!validateInput(3)) return false;
    
    const expectedCode = generateStage3Code(stage3Seed);
    return stage3Code === expectedCode;
  };

  const handleCaptainChallenge = async () => {
    const captainCode = generateStage1Code(seed); // Captain solves the stage 1 challenge
    
    if (captainChallenge.enteredCode === captainCode) {
      setCaptainChallenge({
        ...captainChallenge,
        completed: true,
        codeError: ''
      });
      // Now the final submit should check if the captain challenge is completed too
    } else {
      setCaptainChallenge({
        ...captainChallenge,
        codeError: 'Incorrect code. Try again!'
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateInput('all')) return;
    
    const stage1Valid = checkStage1();
    const stage2Valid = checkStage2();
    const stage3Valid = checkStage3();
    const captainValid = captainChallenge.completed;
    
    const newErrors = { ...errors };
    
    if (!stage1Valid) {
      newErrors.stage1Match = 'Seed and code do not match';
    } else {
      delete newErrors.stage1Match;
    }
    
    if (!stage2Valid) {
      newErrors.stage2Match = 'Seed and phrase do not match';
    } else {
      delete newErrors.stage2Match;
    }
    
    if (!stage3Valid) {
      newErrors.stage3Match = 'Seed and code do not match';
    } else {
      delete newErrors.stage3Match;
    }
    
    if (!captainValid) {
      newErrors.captainChallenge = 'Captain must complete their own challenge first';
    } else {
      delete newErrors.captainChallenge;
    }
    
    setErrors(newErrors);
    
    if (stage1Valid && stage2Valid && stage3Valid && captainValid) {
      setCompleted(true);
      await syncGameState('completed');
    }
  };

  const handleReturnToRoleSelection = () => {
    navigate('/role-selection');
  };

  // Seed entry screen
  if (needSeed) {
    return (
      <div className="stage-container paper-bg">
        <div className="seed-entry-container">
          <h1>Enter Team Seed</h1>
          <p>As the team captain, enter your team's 5-digit seed or create a new one for your team.</p>
          
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

  // If captain hasn't completed a challenge yet, show message
  if (!hasCompletedChallenge && !needSeed) {
    return (
      <div className="stage-container paper-bg">
        <div className="seed-display-badge">
          Team Seed: <strong>{seed}</strong>
        </div>
        
        <div className="stage-content centered-content">
          <h2>Captain Challenge Required</h2>
          <p>As team captain, you must first complete one of the challenges before accessing the captain control panel.</p>
          <button 
            className="return-button"
            onClick={() => navigate('/')}
          >
            Return to Role Selection
          </button>
        </div>
        <DevResetTrigger />
      </div>
    );
  }

  return (
    <div className="stage-container paper-bg">
      <div className="seed-display-badge">
        Team Seed: <strong>{seed}</strong>
      </div>
      
      <div className="stage-content">
        <div className="stage-header">
          <h1>CAPTAIN'S FINAL CHALLENGE</h1>
        </div>
        
        {!completed ? (
          <div className="captain-challenge">
            <div className="instructions">
              <h2>Your Mission</h2>
              <p>As team Captain, your job is to coordinate with your team members and collect their challenge solutions.</p>
              <p>Each team member has completed a unique challenge with a specific seed and code/phrase.</p>
              <p>Enter the seed and corresponding solution from each team member to unlock the final escape mechanism.</p>
              <p>All entries must be correct to proceed.</p>
            </div>
            
            <div className="team-inputs-container">
              <div className="team-input-section">
                <h3>Image Analyst's Solution</h3>
                <div className="input-row">
                  <div className="input-group">
                    <label>Seed:</label>
                    <input 
                      type="text" 
                      value={stage1Seed}
                      onChange={(e) => setStage1Seed(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder="Enter 5-digit seed"
                      maxLength="5"
                    />
                    {errors.stage1Seed && <div className="input-error">{errors.stage1Seed}</div>}
                  </div>
                  
                  <div className="input-group">
                    <label>Code:</label>
                    <input 
                      type="text" 
                      value={stage1Code}
                      onChange={(e) => setStage1Code(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="Enter 4-digit code"
                      maxLength="4"
                    />
                    {errors.stage1Code && <div className="input-error">{errors.stage1Code}</div>}
                  </div>
                </div>
                {errors.stage1Match && <div className="input-error match-error">{errors.stage1Match}</div>}
                
                <button 
                  className="validate-button"
                  onClick={() => {
                    if (checkStage1()) {
                      setErrors({...errors, stage1Match: null});
                    } else {
                      setErrors({...errors, stage1Match: 'Seed and code do not match'});
                    }
                  }}
                >
                  Validate
                </button>
              </div>
              
              <div className="team-input-section">
                <h3>Code Decoder's Solution</h3>
                <div className="input-row">
                  <div className="input-group">
                    <label>Seed:</label>
                    <input 
                      type="text" 
                      value={stage2Seed}
                      onChange={(e) => setStage2Seed(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder="Enter 5-digit seed"
                      maxLength="5"
                    />
                    {errors.stage2Seed && <div className="input-error">{errors.stage2Seed}</div>}
                  </div>
                  
                  <div className="input-group full-width">
                    <label>Secret Phrase:</label>
                    <input 
                      type="text" 
                      value={stage2Phrase}
                      onChange={(e) => setStage2Phrase(e.target.value)}
                      placeholder="Enter the decoded phrase"
                    />
                    {errors.stage2Phrase && <div className="input-error">{errors.stage2Phrase}</div>}
                  </div>
                </div>
                {errors.stage2Match && <div className="input-error match-error">{errors.stage2Match}</div>}
                
                <button 
                  className="validate-button"
                  onClick={() => {
                    if (checkStage2()) {
                      setErrors({...errors, stage2Match: null});
                    } else {
                      setErrors({...errors, stage2Match: 'Seed and phrase do not match'});
                    }
                  }}
                >
                  Validate
                </button>
              </div>
              
              <div className="team-input-section">
                <h3>Quiz Expert's Solution</h3>
                <div className="input-row">
                  <div className="input-group">
                    <label>Seed:</label>
                    <input 
                      type="text" 
                      value={stage3Seed}
                      onChange={(e) => setStage3Seed(e.target.value.replace(/\D/g, '').slice(0, 5))}
                      placeholder="Enter 5-digit seed"
                      maxLength="5"
                    />
                    {errors.stage3Seed && <div className="input-error">{errors.stage3Seed}</div>}
                  </div>
                  
                  <div className="input-group">
                    <label>Code:</label>
                    <input 
                      type="text" 
                      value={stage3Code}
                      onChange={(e) => setStage3Code(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="Enter 4-digit code"
                      maxLength="4"
                    />
                    {errors.stage3Code && <div className="input-error">{errors.stage3Code}</div>}
                  </div>
                </div>
                {errors.stage3Match && <div className="input-error match-error">{errors.stage3Match}</div>}
                
                <button 
                  className="validate-button"
                  onClick={() => {
                    if (checkStage3()) {
                      setErrors({...errors, stage3Match: null});
                    } else {
                      setErrors({...errors, stage3Match: 'Seed and code do not match'});
                    }
                  }}
                >
                  Validate
                </button>
              </div>
            </div>
            
            {!captainChallenge.completed && (
              <div className="captain-own-challenge">
                <h3>Captain's Challenge</h3>
                <p>As Captain, you must also prove your abilities:</p>
                
                <input
                  type="text"
                  value={captainChallenge.enteredCode}
                  onChange={(e) => setCaptainChallenge({
                    ...captainChallenge,
                    enteredCode: e.target.value.replace(/\D/g, '').slice(0, 4)
                  })}
                  placeholder="Enter your code"
                  maxLength="4"
                />
                
                {captainChallenge.codeError && (
                  <p className="error-message">{captainChallenge.codeError}</p>
                )}
                
                <button onClick={handleCaptainChallenge}>
                  Validate Captain Code
                </button>
              </div>
            )}
            
            <button className="submit-all-button" onClick={handleSubmit}>
              Activate Escape Sequence
            </button>
          </div>
        ) : (
          <div className="success-message">
            <h2>MISSION ACCOMPLISHED!</h2>
            <div className="success-content">
              <p>Congratulations, Captain! Your team has successfully completed all challenges and escaped the AI facility.</p>
              <p>Thanks to your leadership and coordination, you've unlocked the final escape mechanism.</p>
            </div>
            
            <div className="team-summary">
              <h3>Team Performance</h3>
              <div className="team-members">
                <div className="team-member">
                  <span className="role">Image Analyst</span>
                  <span className="completion">✓ Completed</span>
                </div>
                <div className="team-member">
                  <span className="role">Code Decoder</span>
                  <span className="completion">✓ Completed</span>
                </div>
                <div className="team-member">
                  <span className="role">Quiz Expert</span>
                  <span className="completion">✓ Completed</span>
                </div>
                <div className="team-member">
                  <span className="role">Captain</span>
                  <span className="completion">✓ Completed</span>
                </div>
              </div>
            </div>
            
            <button className="return-button" onClick={handleReturnToRoleSelection}>
              Start New Mission
            </button>
          </div>
        )}
      </div>
      <DevResetTrigger />
    </div>
  );
};

export default StageFour;
