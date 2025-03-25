/**
 * Utility for tracking and reporting errors in the game
 */

// Track errors that occur during gameplay
let errors = [];

// Add an error to the tracker
export const trackError = (error, context = {}) => {
  const errorDetails = {
    timestamp: new Date().toISOString(),
    message: error.message || 'Unknown error',
    stack: error.stack,
    context
  };
  
  console.error('Game error:', errorDetails);
  errors.push(errorDetails);
  
  // Store errors in session storage for debugging
  try {
    sessionStorage.setItem('game_errors', JSON.stringify(errors));
  } catch (e) {
    console.error('Could not save errors to session storage', e);
  }
  
  return errorDetails;
};

// Get all tracked errors
export const getErrors = () => {
  return [...errors];
};

// Clear tracked errors
export const clearErrors = () => {
  errors = [];
  try {
    sessionStorage.removeItem('game_errors');
  } catch (e) {
    console.error('Could not clear errors from session storage', e);
  }
};

// Global error handler for promise rejections
export const setupGlobalErrorHandling = () => {
  window.addEventListener('unhandledrejection', (event) => {
    trackError(event.reason, { type: 'unhandledRejection' });
  });
  
  window.addEventListener('error', (event) => {
    trackError(event.error || new Error(event.message), { 
      type: 'globalError',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
};
