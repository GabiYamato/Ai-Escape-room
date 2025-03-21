import { useState, useEffect, useRef } from 'react'
import '../styles/CodeEntryOverlay.css'

const CodeEntryOverlay = ({ onSubmit, onCancel }) => {
  const [code, setCode] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const inputRef = useRef(null)
  
  useEffect(() => {
    // Focus the input field when the overlay appears
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (code.trim() === '') {
      setErrorMessage('Please enter a code')
      return
    }
    
    onSubmit(code)
  }
  
  const handleKeyDown = (e) => {
    // Close overlay on Escape key
    if (e.key === 'Escape') {
      onCancel()
    }
  }
  
  return (
    <div className="overlay" onClick={(e) => {
      if (e.target.className === 'overlay') onCancel()
    }}>
      <div className="code-entry-modal">
        <h2>Enter Master Code</h2>
        <p>Enter the code found from AI-generated images</p>
        
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase())
              setErrorMessage('')
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter code here"
            className="code-input"
            maxLength={8}
          />
          
          {errorMessage && <div className="code-error">{errorMessage}</div>}
          
          <div className="modal-buttons">
            <button type="button" onClick={onCancel} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="submit-button">
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CodeEntryOverlay
