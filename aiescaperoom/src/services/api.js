import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3001/api';

// Load or generate a user ID
const getUserId = () => {
  let userId = localStorage.getItem('user-id');
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem('user-id', userId);
  }
  return userId;
};

// Initialize the game state
export const initGameState = async () => {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_URL}/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error initializing game state:', error);
    // Fall back to local storage if server is unavailable
    return {
      timer: parseInt(localStorage.getItem('escape-room-timer') || '0', 10),
      stage: localStorage.getItem('escape-room-stage') || 'splash'
    };
  }
};

// Sync the game state with the server
export const syncGameState = async (stage) => {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, stage }),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing game state:', error);
    // Update local storage as fallback
    if (stage) localStorage.setItem('escape-room-stage', stage);
    return { timer: 0, stage };
  }
};

// Start a new game or continue
export const startGame = async () => {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_URL}/start-game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error starting game:', error);
    // Update local storage as fallback
    localStorage.setItem('escape-room-stage', 'game');
    return { timer: 0, stage: 'game' };
  }
};

// Reset the game
export const resetGame = async () => {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_URL}/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error resetting game:', error);
    // Reset local storage as fallback
    localStorage.setItem('escape-room-timer', '0');
    localStorage.setItem('escape-room-stage', 'splash');
    return { timer: 0, stage: 'splash' };
  }
};

// Report wrong code attempt
export const reportWrongCode = async () => {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_URL}/wrong-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error reporting wrong code:', error);
    return { error: 'Failed to update penalty' };
  }
};
