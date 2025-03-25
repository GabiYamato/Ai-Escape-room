import { useState, useEffect } from 'react';
import { getErrors, clearErrors } from '../utils/errorTracker';

const DebugPanel = ({ gameState }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState([]);
  const [activeTab, setActiveTab] = useState('state');
  
  useEffect(() => {
    // Update errors list when panel is opened
    if (isOpen) {
      setErrors(getErrors());
    }
    
    // Check for errors every 5 seconds when panel is open
    const interval = isOpen ? setInterval(() => {
      setErrors(getErrors());
    }, 5000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen]);
  
  if (!gameState) return null;
  
  return (
    <div className="debug-panel" style={{
      position: 'fixed',
      bottom: isOpen ? '0' : '-280px',
      right: '10px',
      width: '300px',
      height: isOpen ? '300px' : '30px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: '#0f0',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '5px',
      transition: 'height 0.3s, bottom 0.3s',
      zIndex: 9999,
      borderRadius: '5px 5px 0 0',
      overflow: 'hidden'
    }}>
      <div 
        style={{
          padding: '5px',
          cursor: 'pointer',
          textAlign: 'center',
          borderBottom: isOpen ? '1px solid #0f0' : 'none',
          marginBottom: '5px'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? 'Hide Debug' : 'Show Debug'}
      </div>
      
      {isOpen && (
        <div style={{ height: '250px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', marginBottom: '5px' }}>
            <div 
              onClick={() => setActiveTab('state')}
              style={{ 
                padding: '3px 8px', 
                cursor: 'pointer',
                backgroundColor: activeTab === 'state' ? '#0f0' : 'transparent',
                color: activeTab === 'state' ? '#000' : '#0f0',
                borderRadius: '3px 3px 0 0',
                marginRight: '5px'
              }}
            >
              Game State
            </div>
            <div 
              onClick={() => setActiveTab('errors')}
              style={{ 
                padding: '3px 8px', 
                cursor: 'pointer',
                backgroundColor: activeTab === 'errors' ? '#f00' : 'transparent',
                color: activeTab === 'errors' ? '#000' : '#f00',
                borderRadius: '3px 3px 0 0'
              }}
            >
              Errors {errors.length > 0 && `(${errors.length})`}
            </div>
          </div>
          
          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'state' ? (
              <>
                <h3 style={{ margin: '5px 0' }}>Game State</h3>
                <pre style={{ margin: 0 }}>
                  {JSON.stringify(gameState, null, 2)}
                </pre>
              </>
            ) : (
              <>
                <h3 style={{ margin: '5px 0', color: '#f00' }}>Errors</h3>
                {errors.length > 0 ? (
                  errors.map((error, index) => (
                    <div key={index} style={{ 
                      marginBottom: '10px', 
                      borderBottom: '1px solid #333', 
                      paddingBottom: '5px' 
                    }}>
                      <div style={{ color: '#f88' }}>{error.timestamp}</div>
                      <div style={{ color: '#faa' }}>{error.message}</div>
                      {error.context && (
                        <pre style={{ fontSize: '10px', color: '#fcc' }}>
                          {JSON.stringify(error.context, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#0f0', padding: '10px 0' }}>
                    No errors tracked
                  </div>
                )}
                
                {errors.length > 0 && (
                  <button
                    style={{
                      background: '#500',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      cursor: 'pointer',
                      borderRadius: '3px',
                      marginBottom: '10px'
                    }}
                    onClick={() => {
                      clearErrors();
                      setErrors([]);
                    }}
                  >
                    Clear Errors
                  </button>
                )}
              </>
            )}
          </div>
          
          <div style={{ marginTop: '10px' }}>
            <button 
              style={{
                background: '#500',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                cursor: 'pointer',
                borderRadius: '3px',
                marginRight: '5px'
              }}
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
            >
              Clear Storage & Reload
            </button>
            
            <button
              style={{
                background: '#050',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                cursor: 'pointer',
                borderRadius: '3px'
              }}
              onClick={() => {
                window.location.href = '/';
              }}
            >
              Go to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
