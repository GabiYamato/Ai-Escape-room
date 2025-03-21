import { useState, useEffect } from 'react';

const DebugInfo = () => {
  const [info, setInfo] = useState({
    routerWorks: false,
    reactVersion: null,
    routerVersion: null,
    error: null
  });

  useEffect(() => {
    try {
      // Check React version
      const reactVersion = React.version;
      
      // Try importing React Router components dynamically
      import('react-router-dom').then(router => {
        setInfo({
          routerWorks: true,
          reactVersion,
          routerVersion: router.version || 'unknown',
          error: null
        });
      }).catch(err => {
        setInfo(prev => ({
          ...prev,
          error: `React Router error: ${err.message}`
        }));
      });
    } catch (err) {
      setInfo(prev => ({
        ...prev,
        error: `Error: ${err.message}`
      }));
    }
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      padding: '10px',
      backgroundColor: '#333',
      color: 'white',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999
    }}>
      <h4>Debug Info</h4>
      <pre>
        React: {info.reactVersion || 'unknown'}<br />
        Router working: {info.routerWorks ? 'Yes' : 'No'}<br />
        Router version: {info.routerVersion || 'unknown'}<br />
        {info.error && `Error: ${info.error}`}
      </pre>
    </div>
  );
};

export default DebugInfo;
