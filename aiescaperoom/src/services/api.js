import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3001/api';

// Load or generate a user ID
const getUserId = () => {
  let userId = sessionStorage.getItem('user-id'); // Use sessionStorage instead of localStorage
  if (!userId) {
    userId = uuidv4();
    sessionStorage.setItem('user-id', userId);
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
    return {
      stage: sessionStorage.getItem('escape-room-stage') || 'splash'
    };
  }
};

// Sync the game state with the server
export const syncGameState = async (stage) => {
  try {
    const userId = getUserId();
    const requestBody = { userId, stage };
    
    const response = await fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing game state:', error);
    // Update sessionStorage as fallback
    if (stage) sessionStorage.setItem('escape-room-stage', stage);
    return { stage };
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
    // Update sessionStorage as fallback
    sessionStorage.setItem('escape-room-stage', 'game');
    return { stage: 'game' };
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
    // Reset sessionStorage as fallback
    sessionStorage.removeItem('escape-room-stage');
    return { stage: 'splash' };
  }
};

// Report wrong code attempt - simplified version
export const reportWrongCode = async () => {
  console.log('Wrong code attempt reported');
  return { error: null };
};
