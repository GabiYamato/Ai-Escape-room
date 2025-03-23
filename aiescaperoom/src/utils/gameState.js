// Game state management utilities

// Constants for localStorage keys
const KEYS = {
  SEED: 'ai_escape_seed',
  DISCOVERED_CODES: 'ai_escape_discovered_codes',
  COMPLETED_STAGES: 'ai_escape_completed_stages',
  FLIPPED_IMAGES: 'ai_escape_flipped_images',
  PROCESSED_IMAGES: 'ai_escape_processed_images',
  GAME_STATE: 'ai_escape_game_state'
};

// Store seed
export const storeSeed = (seed) => {
  localStorage.setItem(KEYS.SEED, seed);
};

// Get seed
export const getSeed = () => {
  return localStorage.getItem(KEYS.SEED);
};

// Store discovered codes
export const storeDiscoveredCodes = (codes) => {
  localStorage.setItem(KEYS.DISCOVERED_CODES, JSON.stringify(codes));
};

// Get discovered codes
export const getDiscoveredCodes = () => {
  const codes = localStorage.getItem(KEYS.DISCOVERED_CODES);
  return codes ? JSON.parse(codes) : [];
};

// Mark stage as complete
export const markStageComplete = (stageNumber) => {
  const completedStages = getCompletedStages();
  if (!completedStages.includes(stageNumber)) {
    completedStages.push(stageNumber);
  }
  localStorage.setItem(KEYS.COMPLETED_STAGES, JSON.stringify(completedStages));
};

// Get completed stages
export const getCompletedStages = () => {
  const stages = localStorage.getItem(KEYS.COMPLETED_STAGES);
  return stages ? JSON.parse(stages) : [];
};

// Check if stage is complete
export const isStageComplete = (stageNumber) => {
  const completedStages = getCompletedStages();
  return completedStages.includes(stageNumber);
};

// Store flipped images
export const storeFlippedImages = (imageIds) => {
  localStorage.setItem(KEYS.FLIPPED_IMAGES, JSON.stringify(imageIds));
};

// Get flipped images
export const getFlippedImages = () => {
  const images = localStorage.getItem(KEYS.FLIPPED_IMAGES);
  return images ? JSON.parse(images) : [];
};

// Store processed images
export const storeProcessedImages = (imageIds) => {
  localStorage.setItem(KEYS.PROCESSED_IMAGES, JSON.stringify(Array.from(imageIds)));
};

// Get processed images
export const getProcessedImages = () => {
  const images = localStorage.getItem(KEYS.PROCESSED_IMAGES);
  return images ? new Set(JSON.parse(images)) : new Set();
};

// Store full game state (can be used for specific stages)
export const storeGameState = (stage, stateObject) => {
  const key = `${KEYS.GAME_STATE}_${stage}`;
  localStorage.setItem(key, JSON.stringify(stateObject));
};

// Get full game state
export const getGameState = (stage) => {
  const key = `${KEYS.GAME_STATE}_${stage}`;
  const state = localStorage.getItem(key);
  return state ? JSON.parse(state) : null;
};

// Clear all game state (for reset)
export const clearAllGameState = () => {
  Object.values(KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Also clear stage-specific game states
  for(let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if(key.startsWith('ai_escape_')) {
      localStorage.removeItem(key);
    }
  }
};
