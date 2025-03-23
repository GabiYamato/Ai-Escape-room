/**
 * Utility functions for handling seed-based code generation
 */

// Import quiz questions
import quizData from '../data/quizquestions.json';

// Fixed solutions from solution.txt
const SOLUTIONS = {
  stage1: {
    '10000': '3756', '10001': '8142', '10002': '5967', '10003': '2310', '10004': '9485',
    '10005': '1629', '10006': '4073', '10007': '7518', '10008': '6291', '10009': '0436',
    '10010': '5821', '10011': '3074', '10012': '8659', '10013': '9132', '10014': '1507',
    '10015': '4280', '10016': '7923', '10017': '6348', '10018': '0791', '10019': '2164'
  },
  stage2: {
    '10000': 'gold experience cancer', '10001': 'quantum escape protocol', 
    '10002': 'binary system override', '10003': 'neural network breach',
    '10004': 'algorithm deconstructor', '10005': 'machine learning anomaly',
    '10006': 'artificial intelligence key', '10007': 'cognitive system unlock',
    '10008': 'synthetic reasoning code', '10009': 'virtual reality exit',
    '10010': 'gold experience cancer', '10011': 'quantum escape protocol',
    '10012': 'binary system override', '10013': 'neural network breach',
    '10014': 'algorithm deconstructor', '10015': 'machine learning anomaly',
    '10016': 'artificial intelligence key', '10017': 'cognitive system unlock',
    '10018': 'synthetic reasoning code', '10019': 'virtual reality exit'
  },
  stage3: {
    '10000': '8214', '10001': '5790', '10002': '3167', '10003': '9425', '10004': '6078',
    '10005': '2631', '10006': '7943', '10007': '4506', '10008': '1892', '10009': '0357',
    '10010': '6541', '10011': '3908', '10012': '7463', '10013': '2179', '10014': '8036',
    '10015': '5724', '10016': '9380', '10017': '1657', '10018': '4295', '10019': '0812'
  }
};

// Validate that a seed is in the correct range
export const isValidSeed = (seed) => {
  return SOLUTIONS.stage1.hasOwnProperty(seed);
};

// Get a valid seed or default to 10000
export const getValidSeed = (seed) => {
  if (isValidSeed(seed)) {
    return seed;
  }
  
  // Default to 10000 if invalid
  return "10000";
};

// Generate a code based on seed for Stage 1 (Image Analyst)
export function generateStage1Code(seed) {
  const validSeed = getValidSeed(seed);
  return SOLUTIONS.stage1[validSeed];
}

// Generate a phrase based on seed for Stage 2 (Code Decoder)
export function generateStage2Phrase(seed) {
  const validSeed = getValidSeed(seed);
  return SOLUTIONS.stage2[validSeed];
}

// Updated code generator that gives unique codes for seeds 10000-10019
export const generateStage3Code = (seed) => {
  // Special range for seeds 10000-10019
  if (seed >= 10000 && seed <= 10019) {
    // Array of predefined unique codes for our special range
    const specialCodes = [
      "2578", "3694", "1457", "8925", "6241",
      "7893", "4516", "9382", "5127", "3768",
      "1249", "5836", "7413", "2965", "8241",
      "5917", "3628", "9451", "4782", "6139"
    ];
    
    // Return the appropriate code from the array
    return specialCodes[seed - 10000];
  }
  
  // For other seeds, use a deterministic algorithm
  // This ensures the same seed always gives the same code
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Generate 4 digits between 0-9
  const digits = [];
  const hashStr = Math.abs(hash).toString();
  
  for (let i = 0; i < 4; i++) {
    // Use different parts of the hash for each digit
    const position = (i * 3) % hashStr.length;
    digits.push(parseInt(hashStr.charAt(position)) % 10);
  }
  
  return digits.join('');
};
