import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/RoleSelection.css';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [isCaptain, setIsCaptain] = useState(false);
  // Set a default fixed seed from our allowed range
  const [seed, setSeed] = useState('10000');
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  const roles = [
    {
      id: 'image-analyst',
      title: 'Image Analyst',
      description: 'Find AI-generated images to discover hidden codes',
      stage: '/stage1',
      icon: '🖼️',
      color: '#e50914' // Netflix red
    },
    {
      id: 'code-decoder',
      title: 'Code Decoder',
      description: 'Decode Morse code messages with cryptic clues',
      stage: '/stage2',
      icon: '📻',
      color: '#4285f4' // Google blue
    },
    {
      id: 'quiz-expert',
      title: 'Quiz Expert',
      description: 'Answer questions about AI to reveal secret access codes',
      stage: '/stage3',
      icon: '🧠',
      color: '#0f9d58' // Google green
    }
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setShowConfirm(true);
  };

  const handleCaptainToggle = () => {
    setIsCaptain(!isCaptain);
  };

  const handleConfirm = () => {
    if (!selectedRole) return;
    
    // Store in localStorage that user is captain if selected
    if (isCaptain) {
      localStorage.setItem('ai_escape_is_captain', 'true');
      localStorage.setItem('ai_escape_captain_seed', seed);
    }
    
    // Always go to the selected role's stage first
    // After they complete it, they'll be redirected to Stage Four if they're captain
    navigate(`${selectedRole.stage}?seed=${seed}`);
  };

  const handleCancel = () => {
    setSelectedRole(null);
    setShowConfirm(false);
  };

  // Show confirmation dialog after selection
  if (showConfirm) {
    return (
      <div className="role-selection-container">
        <div className="confirmation-dialog">
          <h2>Confirm Your Selection</h2>
          
          <div className="selected-role">
            <div className="role-icon" style={{ backgroundColor: selectedRole.color }}>
              {selectedRole.icon}
            </div>
            <h3>{selectedRole.title}</h3>
          </div>
          
          <div className="seed-display">
            <span>Team Seed: </span>
            <strong>{seed}</strong>
            <p className="seed-note">Share this seed with your team members</p>
            
            {/* Add a seed selector */}
            <div className="seed-selector">
              <label>Choose a team seed: </label>
              <select 
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="seed-dropdown"
              >
                {Array.from({length: 20}, (_, i) => 10000 + i).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="captain-toggle">
            <label className="toggle-container">
              <span className="toggle-label">I am the Captain</span>
              <div className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={isCaptain} 
                  onChange={handleCaptainToggle}
                />
                <span className="toggle-slider"></span>
              </div>
            </label>
            <p className="captain-note">Captains coordinate the team and solve the final challenge</p>
          </div>
          
          <div className="confirmation-buttons">
            <button className="cancel-button" onClick={handleCancel}>Back</button>
            <button className="confirm-button" onClick={handleConfirm}>Start Challenge</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="role-selection-container">
      <div className="profile-selection">
        <h1>Who's Playing?</h1>
        
        <div className="profiles-container">
          {roles.map((role) => (
            <div 
              key={role.id}
              className="profile"
              onClick={() => handleRoleSelect(role)}
            >
              <div className="profile-icon" style={{ backgroundColor: role.color }}>
                <span>{role.icon}</span>
              </div>
              <div className="profile-name">{role.title}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="dev-reset-trigger" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'D', 'ctrlKey': true, 'shiftKey': true}))}>
        Reset (Dev)
      </div>
    </div>
  );
};

export default RoleSelection;
