import { useState, useEffect, useRef } from 'react';
import '../styles/CommandInput.css';

const CommandInput = ({ onCommand }) => {
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);
  
  // Focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedCommand = command.trim();
    
    if (trimmedCommand) {
      // Execute the command
      onCommand(trimmedCommand);
      
      // Add to history only if it's not the same as the last command
      setCommandHistory(prev => {
        if (prev.length === 0 || prev[prev.length - 1] !== trimmedCommand) {
          return [...prev, trimmedCommand];
        }
        return prev;
      });
      
      // Reset state
      setCommand('');
      setHistoryIndex(-1);
    }
  };
  
  const handleKeyDown = (e) => {
    // Navigate command history with up/down arrows
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } 
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };
  
  return (
    <div className="command-input-container">
      <form onSubmit={handleSubmit} className="command-form">
        <div className="command-prompt">
          <span className="prompt-symbol">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            className="command-text-input"
            spellCheck="false"
            autoComplete="off"
          />
        </div>
        <button type="submit" className="execute-button">EXECUTE</button>
      </form>
    </div>
  );
};

export default CommandInput;
