import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { syncGameState, reportWrongCode } from '../services/api';
import { generateStage3Code } from '../utils/seedGenerator';
import quizData from '../data/quizquestions.json';
import '../styles/StageThree.css';
import '../styles/CommonUI.css';
import DevResetTrigger from '../components/DevResetTrigger';

const StageThree = () => {
  const [answers, setAnswers] = useState({});
  const [completed, setCompleted] = useState(false);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [correctQuestions, setCorrectQuestions] = useState([]);
  const [seed, setSeed] = useState('');
  const [doorCode, setDoorCode] = useState('');
  const [showCompletionDetails, setShowCompletionDetails] = useState(false);
  const [securityLevel, setSecurityLevel] = useState("Maximum");
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [shuffledFragmentIndices, setShuffledFragmentIndices] = useState([]);
  
  // Penalty tracking
  const [penaltyActive, setPenaltyActive] = useState(false);
  const [penaltyCountdown, setPenaltyCountdown] = useState(60);
  const [lockedQuestions, setLockedQuestions] = useState({});
  const [resetWarningActive, setResetWarningActive] = useState(false);
  const [needCorrectAnswer, setNeedCorrectAnswer] = useState(false);
  
  const [terminalMessages, setTerminalMessages] = useState([
    { text: "> SECURITY BREACH DETECTED", type: "error" },
    { text: "> IDENTIFYING INTRUDER...", type: "system" },
    { text: "> INITIATING AI KNOWLEDGE VERIFICATION PROTOCOL", type: "system" },
    { text: "> ANSWER CORRECTLY TO BYPASS SECURITY...", type: "warning" }
  ]);
  
  const terminalRef = useRef(null);
  const alarmSoundRef = useRef(null);
  const typingSoundRef = useRef(null);
  const successSoundRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array, seedString) => {
    // Create a seedable random number generator
    const seededRandom = (max) => {
      // Simple string hash for seeding
      let hash = 0;
      for (let i = 0; i < seedString.length; i++) {
        hash = ((hash << 5) - hash) + seedString.charCodeAt(i);
        hash |= 0; // Convert to integer
      }
      // Use the hash as a seed for randomness
      const x = Math.sin(hash++) * 10000;
      return x - Math.floor(x);
    };
    
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  
  // Get seed from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const seedParam = params.get('seed');
    if (seedParam) {
      setSeed(seedParam);
      // Generate the door code based on the seed
      const generatedCode = generateStage3Code(seedParam);
      setDoorCode(generatedCode);
      
      // Also shuffle the questions based on the seed for consistent ordering
      const shuffled = shuffleArray(quizData.questions, seedParam);
      setShuffledQuestions(shuffled);
      
      // Create shuffled indices for the code fragments
      // This will make contestants have to figure out the correct order
      const relevantQCount = quizData.questions.filter(q => q.isrelavant === 1).length;
      let indices = Array.from({length: relevantQCount}, (_, i) => i);
      setShuffledFragmentIndices(shuffleArray(indices, seedParam + "fragments"));
    } else {
      // If no seed, still shuffle the questions
      setShuffledQuestions([...quizData.questions]);
      setShuffledFragmentIndices([0, 1, 2, 3]); // Default order
    }
  }, [location.search]);

  // Use shuffledQuestions instead of directly using quizData.questions
  // Get the questions from the imported JSON
  const questions = shuffledQuestions;
  
  // Filter relevant questions (those with isrelavant=1)
  const relevantQuestions = questions.filter(q => q.isrelavant === 1);
  
  // Get the code digit for a specific question
  const getCodeDigit = (question) => {
    // Get the position based on question id to map to the doorCode
    const questionIndex = relevantQuestions.findIndex(q => 
      q.question === question.question
    );
    
    if (questionIndex === -1) return null;
    return doorCode[questionIndex];
  };
  
  // New function to get shuffled fragment labels
  const getFragmentLabel = (index) => {
    // Give cryptic labels that don't reveal the order
    return `FRAG-${String.fromCharCode(65 + index)}`; // A, B, C, D instead of 1, 2, 3, 4
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

  // Trigger security alarm
  const triggerAlarm = () => {
    setAlarmTriggered(true);
    if (alarmSoundRef.current) {
      alarmSoundRef.current.play().catch(err => {});
    }
    
    addTerminalMessage("SECURITY ALERT! UNAUTHORIZED ACCESS ATTEMPT", "error");
    addTerminalMessage("INCREASING SECURITY PROTOCOLS", "error");
  };
  
  // Handle security level updates based on correct answers
  useEffect(() => {
    if (correctQuestions.length === 0) {
      setSecurityLevel("Maximum");
    } else if (correctQuestions.length < questions.length * 0.25) {
      setSecurityLevel("High");
    } else if (correctQuestions.length < questions.length * 0.5) {
      setSecurityLevel("Medium");
    } else if (correctQuestions.length < questions.length * 0.75) {
      setSecurityLevel("Low");
    } else {
      setSecurityLevel("Minimum");
    }
  }, [correctQuestions, questions.length]);

  // Penalty countdown effect - KEEP ONLY THIS VERSION and remove the duplicate
  useEffect(() => {
    let interval;
    
    if (penaltyActive && penaltyCountdown > 0) {
      interval = setInterval(() => {
        setPenaltyCountdown(prev => {
          // Show warnings when time is running out
          if (prev <= 15 && prev % 5 === 0) {
            addTerminalMessage(`WARNING: ANSWER CORRECTLY IN ${prev} SECONDS OR ALL PROGRESS WILL BE RESET`, "error");
            setResetWarningActive(true);
            setTimeout(() => setResetWarningActive(false), 500);
          }
          return prev - 1;
        });
      }, 1000);
    } else if (penaltyCountdown === 0) {
      // Time's up - if they haven't answered correctly, reset ALL progress
      if (needCorrectAnswer) {
        // Reset all progress
        setAnswers({});
        setCorrectQuestions([]);
        addTerminalMessage("SECURITY BREACH PROTOCOL ACTIVATED", "error");
        addTerminalMessage("ALL PROGRESS RESET", "error");
        triggerAlarm();
      }
      
      // Reset the penalty state
      setPenaltyActive(false);
      setPenaltyCountdown(60);
      setNeedCorrectAnswer(false);
      
      // When penalty countdown hits 0, also unlock correctly answered questions
      addTerminalMessage("SECURITY RESET: ALL QUESTIONS CAN NOW BE CHANGED", "warning");
      
      // Keep the alarm state for a bit longer for effect
      setTimeout(() => {
        setAlarmTriggered(false);
        if (alarmSoundRef.current) {
          alarmSoundRef.current.pause();
          alarmSoundRef.current.currentTime = 0;
        }
      }, 3000);
    }
    
    return () => clearInterval(interval);
  }, [penaltyActive, penaltyCountdown, needCorrectAnswer]);

  // Enhanced answer selection with penalties - significantly modify the locking behavior
  const handleAnswerSelect = (questionId, optionIndex) => {
    // Add debugging to check questionId
    console.log(`Handling answer for questionId: ${questionId}`);
    
    // Check if this specific question is locked due to incorrect answer
    if (lockedQuestions[questionId]) {
      addTerminalMessage(`QUESTION #${questionId} LOCKED FOR ${lockedQuestions[questionId]} SECONDS - TRY ANOTHER QUESTION`, "error");
      return;
    }
    
    // IMPORTANT NEW ADDITION: Check if question is already answered correctly - these are also locked
    const existingAnswer = answers[questionId];
    if (existingAnswer && existingAnswer.isCorrect) {
      addTerminalMessage(`QUESTION #${questionId} ALREADY CORRECTLY ANSWERED - LOCKED`, "warning");
      return;
    }
    
    const question = questions.find(q => q.id === questionId);
    if (!question) {
      console.error(`Question with ID ${questionId} not found!`);
      return;
    }
    
    const isCorrect = optionIndex + 1 === question.correctoption;
    
    setAnswers({
      ...answers,
      [questionId]: { selected: optionIndex, isCorrect }
    });
    
    if (isCorrect) {
      if (!correctQuestions.includes(questionId)) {
        setCorrectQuestions([...correctQuestions, questionId]);
        
        // Success feedback
        if (successSoundRef.current) {
          successSoundRef.current.currentTime = 0;
          successSoundRef.current.play().catch(err => {});
        }
        
        addTerminalMessage(`SECURITY TEST ${questionId} BYPASSED`, "success");
        
        if (question.isrelavant === 1) {
          addTerminalMessage(`ACCESS CODE FRAGMENT DISCOVERED: [${getCodeDigit(question)}]`, "success");
        }
        
        // If we needed a correct answer during a penalty, this satisfies that
        if (needCorrectAnswer) {
          setNeedCorrectAnswer(false);
          setPenaltyActive(false);
          setPenaltyCountdown(60);
          setAlarmTriggered(false);
          addTerminalMessage("RESET COUNTDOWN CANCELLED - SECURITY THREAT CONTAINED", "success");
          addTerminalMessage("ALL LOCKED QUESTIONS WILL REMAIN LOCKED UNTIL THEIR TIMERS EXPIRE", "warning");
          
          // Do NOT clear locked questions - they remain locked for their individual timers
          if (alarmSoundRef.current) {
            alarmSoundRef.current.pause();
            alarmSoundRef.current.currentTime = 0;
          }
        }
      }
      // Add a specific message that this question is now locked
      addTerminalMessage(`QUESTION #${questionId} CORRECTLY ANSWERED - NOW LOCKED`, "success");
    } else {
      // Wrong answer - only lock this specific question
      if (correctQuestions.includes(questionId)) {
        setCorrectQuestions(correctQuestions.filter(id => id !== questionId));
      }
      
      // Trigger the alarm and penalty countdown
      triggerAlarm();
      setPenaltyActive(true);
      setNeedCorrectAnswer(true);
      
      // Lock ONLY THIS question for 60 seconds - all other questions remain usable
      const updatedLockedQuestions = { ...lockedQuestions };
      updatedLockedQuestions[questionId] = 60;
      setLockedQuestions(updatedLockedQuestions);
      
      // Start a countdown timer for just this question
      const intervalId = setInterval(() => {
        setLockedQuestions(prev => {
          const updated = { ...prev };
          if (updated[questionId] <= 1) {
            delete updated[questionId];
            clearInterval(intervalId);
            addTerminalMessage(`QUESTION #${questionId} UNLOCKED - NOW AVAILABLE`, "system");
          } else {
            updated[questionId] -= 1;
          }
          return updated;
        });
      }, 1000);
      
      addTerminalMessage(`INCORRECT RESPONSE - QUESTION #${questionId} LOCKED FOR 60 SECONDS`, "error");
      addTerminalMessage("OTHER QUESTIONS REMAIN AVAILABLE - ANSWER ONE CORRECTLY WITHIN 60 SECONDS", "warning");
      addTerminalMessage("FAILURE WILL RESULT IN COMPLETE SECURITY RESET", "warning");
    }
  };

  // Handle code submission - modify to add countdown and scrolling
  const handleSubmitCode = async () => {
    addTerminalMessage("VERIFYING SECURITY OVERRIDE CODE...", "system");
    
    // Ensure terminal scrolls to bottom to show the new message
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
    
    setTimeout(async () => {
      if (enteredCode === doorCode) {
        if (successSoundRef.current) {
          successSoundRef.current.play().catch(err => {});
        }
        
        // Add a dramatic countdown effect
        addTerminalMessage("CODE ACCEPTED - SECURITY OVERRIDE SUCCESSFUL", "success");
        
        // Add a slight delay between messages for dramatic effect
        setTimeout(() => {
          addTerminalMessage("LAB CONTAINMENT SYSTEMS DISENGAGED", "success");
          
          // Scroll to make sure messages are visible
          if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
          }
          
          setTimeout(() => {
            // Add the countdown message
            addTerminalMessage("ESCAPING THE ROOM IN 3...2...1.....", "success");
            
            // Scroll to top to see the escape message
            if (terminalRef.current) {
              terminalRef.current.scrollTop = 0;
            }
            
            setTimeout(() => {
              setCodeError('');
              setCompleted(true);
              syncGameState('stage3-completed');
            }, 2000);
          }, 1000);
        }, 1000);
      } else {
        // Report wrong code but DON'T trigger penalty
        await reportWrongCode();
        setCodeError('OVERRIDE FAILED - INVALID SECURITY CODE');
        setEnteredCode('');
        
        // Just add an error message without triggering alarm or penalty
        addTerminalMessage("INCORRECT OVERRIDE CODE - ACCESS DENIED", "error");
        addTerminalMessage("RETRY WITH CORRECT CODE SEQUENCE", "warning");
      }
    }, 1500);
  };

  const handleShowCodeEntry = () => {
    setShowCodeEntry(true);
    setCodeError('');
  };

  const toggleCompletionDetails = () => {
    setShowCompletionDetails(!showCompletionDetails);
  };

  const handleReturnToRoleSelection = () => {
    navigate('/role-selection');
  };

  // Calculate how many correct relevant answers
  const correctRelevantQuestions = correctQuestions.filter(id => {
    const question = questions.find(q => q.id === id);
    return question && question.isrelavant === 1;
  });

  useEffect(() => {
    // Add a check for if user is captain and has completed this stage
    const isUserCaptain = localStorage.getItem('ai_escape_is_captain') === 'true';
    
    // When stage is completed and user is captain, redirect to StageFour
    if (completed && isUserCaptain) {
      const captainSeed = localStorage.getItem('ai_escape_captain_seed') || seed;
      navigate(`/stage4?seed=${captainSeed}`);
    }
  }, [completed, navigate, seed]);

  return (
    <div className={`stage-container paper-bg ${alarmTriggered || penaltyActive ? 'alarm-active' : ''} ${resetWarningActive ? 'reset-warning' : ''}`}>
      <audio ref={alarmSoundRef} src="/sounds/alarm.mp3" loop />
      <audio ref={typingSoundRef} src="/sounds/typing.mp3" />
      <audio ref={successSoundRef} src="/sounds/success.mp3" />
      
      <div className="security-hud">
        <div className="security-level" data-level={securityLevel.toLowerCase()}>
          SECURITY: {securityLevel}
        </div>
        
        {penaltyActive && (
          <div className="penalty-countdown">
            <span>ANSWER CORRECTLY IN:</span> {penaltyCountdown}s
          </div>
        )}
        
        <div className="seed-badge">
          LAB ID: <strong>{seed}</strong>
        </div>
      </div>
      
      <div className="stage-content lab-terminal">
        <div className="stage-header">
          <h1>DR. FINKELSTEIN'S SECURITY SYSTEM</h1>
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
              
              {/* Progress indicator with security system theme */}
              <div className="lab-status">
                <div className="security-progress">
                  <h3>SECURITY BYPASS PROGRESS</h3>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{width: `${(correctQuestions.length/questions.length)*100}%`}}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {correctQuestions.length} / {questions.length} TESTS BYPASSED
                  </div>
                </div>
                
                {correctRelevantQuestions.length > 0 && (
                  <div className="security-codes">
                    <h3>SECURITY OVERRIDE FRAGMENTS</h3>
                    <div className="code-matrix">
                      {shuffledFragmentIndices.map((originalIndex, displayIndex) => {
                        const question = relevantQuestions[originalIndex];
                        const isFound = question && correctQuestions.includes(question.id);
                        return (
                          <div 
                            key={displayIndex} 
                            className={`code-fragment ${isFound ? 'found' : ''}`}
                          >
                            <div className="fragment-label">{getFragmentLabel(displayIndex)}</div>
                            <div className="fragment-value">
                              {isFound ? doorCode[originalIndex] : '?'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="fragment-hint">
                      <p>WARNING: Security fragments may not be in correct sequence order. Analyze with caution.</p>
                    </div>
                  </div>
                )}
                
                {/* NEW CODE ENTRY UI - placed below fragments, above questions */}
                {correctRelevantQuestions.length === relevantQuestions.length && (
                  <div className="inline-code-entry">
                    <h3>SECURITY OVERRIDE INPUT</h3>
                    <div className="code-entry-container">
                      <div className="code-entry-terminal">
                        <p className="terminal-text">ENTER 4-DIGIT SECURITY OVERRIDE CODE</p>
                        <div className="blinking-cursor"></div>
                        
                        <div className="override-input-container">
                          <input
                            type="text"
                            value={enteredCode}
                            onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
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
                          className="execute-button full-width"
                          onClick={handleSubmitCode}
                          disabled={enteredCode.length !== 4}
                        >
                          EXECUTE OVERRIDE
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Quiz questions with a lab security test theme */}
              <div className="security-tests">
                <h3>SECURITY VERIFICATION SYSTEM</h3>
                <div className="test-grid">
                  {shuffledQuestions.map((question) => {
                    const answer = answers[question.id];
                    const isAnswered = answer !== undefined;
                    const isCorrect = isAnswered && answer.isCorrect;
                    
                    // A question is locked if:
                    // 1. It's in the lockedQuestions state (answered incorrectly), OR
                    // 2. It's been answered correctly
                    const isLocked = lockedQuestions[question.id] > 0 || isCorrect;
                    
                    // Only questions that aren't locked and aren't correctly answered are available during penalty
                    const isAvailableDuringPenalty = !isLocked && penaltyActive;
                    
                    return (
                      <div 
                        key={question.id} 
                        className={`security-test 
                                  ${isAnswered ? (isCorrect ? 'passed correctly-locked' : 'failed') : ''} 
                                  ${lockedQuestions[question.id] > 0 ? 'locked incorrectly-locked' : ''} 
                                  ${isAvailableDuringPenalty ? 'available-during-penalty' : ''}`}
                        onClick={() => !isLocked && handleAnswerSelect(question.id, 0)}
                      >
                        <div className="test-header">
                          <div className="test-id">TEST #{question.id}</div>
                          <div className="security-badge">
                            {isLocked ? (
                              <span className="locked-timer">LOCKED: {lockedQuestions[question.id]}s</span>
                            ) : penaltyActive ? (
                              <span className="available-badge">AVAILABLE NOW</span>
                            ) : (
                              question.isrelavant === 1 ? 'CRITICAL' : 'STANDARD'
                            )}
                          </div>
                          {isCorrect && question.isrelavant === 1 && (
                            <div className="code-badge">
                              CODE: {getCodeDigit(question)}
                            </div>
                          )}
                        </div>
                        
                        <p className="test-question">{question.question}</p>
                        
                        <div className="test-options">
                          {[question.option1, question.option2, question.option3, question.option4]
                            .filter(option => option) // Filter out any undefined options
                            .map((option, index) => {
                              const selected = isAnswered && answer.selected === index;
                              return (
                                <div 
                                  key={index}
                                  className={`test-option 
                                            ${selected ? (isCorrect ? 'correct' : 'incorrect') : ''} 
                                            ${isLocked ? 'disabled' : ''} 
                                            ${!isLocked && penaltyActive ? 'emergency-available' : ''}`}
                                  onClick={(e) => {
                                    // Prevent parent onClick from firing
                                    e.stopPropagation();
                                    if (!isLocked) handleAnswerSelect(question.id, index);
                                  }}
                                >
                                  <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                                  <span className="option-text">{option}</span>
                                  {isLocked && <span className="lock-icon">🔒</span>}
                                </div>
                              );
                          })}
                        </div>
                        
                        {lockedQuestions[question.id] > 0 && (
                          <div className="lock-message">
                            This question is temporarily locked for {lockedQuestions[question.id]} seconds - Try other questions
                          </div>
                        )}
                        
                        {isCorrect && !lockedQuestions[question.id] && (
                          <div className="correct-lock-message">
                            Correct answer - Question locked until timer reset
                          </div>
                        )}
                        
                        {!isLocked && penaltyActive && (
                          <div className="available-message">
                            <span className="pulse-icon">⚡</span> This question is AVAILABLE - answer correctly to stop the reset!
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Remove the old overlay-based code entry */}
          </div>
        ) : (
          // Fix the structure of the completion section
          <div className="escape-success">
            <h2>LAB SECURITY OVERRIDDEN</h2>
            <div className="success-animation"></div>
            <p>You've successfully hacked Dr. Finkelstein's security system and escaped the facility.</p>
            
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
                    <span>OVERRIDE CODE:</span>
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

export default StageThree;