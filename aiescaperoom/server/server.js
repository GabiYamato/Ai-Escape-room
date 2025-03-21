import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());

// Data storage path
const dataPath = path.join(__dirname, 'data');
const usersFile = path.join(dataPath, 'users.json');

// Ensure data directory exists
async function ensureDataDirExists() {
  try {
    await fs.access(dataPath);
  } catch (err) {
    await fs.mkdir(dataPath, { recursive: true });
    // Create initial users file
    await fs.writeFile(usersFile, JSON.stringify({ users: {} }));
  }
}

// Get user data
async function getUserData(userId) {
  try {
    const data = await fs.readFile(usersFile, 'utf8');
    const users = JSON.parse(data).users;
    return users[userId] || null;
  } catch (err) {
    console.error('Error reading user data:', err);
    return null;
  }
}

// Save user data
async function saveUserData(userId, userData) {
  try {
    const data = await fs.readFile(usersFile, 'utf8');
    const users = JSON.parse(data).users;
    users[userId] = userData;
    await fs.writeFile(usersFile, JSON.stringify({ users }));
    return true;
  } catch (err) {
    console.error('Error saving user data:', err);
    return false;
  }
}

// Calculate elapsed time in seconds
function calculateElapsedTime(startTime) {
  return Math.floor((Date.now() - startTime) / 1000);
}

// Routes
app.post('/api/init', async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  await ensureDataDirExists();
  let userData = await getUserData(userId);
  
  if (!userData) {
    userData = {
      startTime: null,
      stage: 'splash',
      penalties: 0,
      lastTimestamp: Date.now()
    };
  }
  
  // Calculate timer based on startTime and penalties
  let timer = 0;
  if (userData.startTime) {
    timer = calculateElapsedTime(userData.startTime) + (userData.penalties || 0) * 60;
  }
  
  await saveUserData(userId, userData);
  res.json({ ...userData, timer });
});

app.post('/api/sync', async (req, res) => {
  const { userId, stage } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  await ensureDataDirExists();
  let userData = await getUserData(userId) || {
    startTime: null,
    stage: 'splash',
    penalties: 0,
    lastTimestamp: Date.now()
  };

  // Update data
  if (stage) userData.stage = stage;
  userData.lastTimestamp = Date.now();
  
  // Calculate timer based on startTime and penalties
  let timer = 0;
  if (userData.startTime) {
    timer = calculateElapsedTime(userData.startTime) + (userData.penalties || 0) * 60;
  }

  const success = await saveUserData(userId, userData);
  if (success) {
    res.json({ ...userData, timer });
  } else {
    res.status(500).json({ error: 'Failed to update data' });
  }
});

app.post('/api/start-game', async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  await ensureDataDirExists();
  let userData = await getUserData(userId) || {
    penalties: 0,
    stage: 'game',
    lastTimestamp: Date.now()
  };
  
  // Only set startTime if it doesn't exist yet
  if (!userData.startTime) {
    userData.startTime = Date.now();
  }
  userData.stage = 'game';
  
  const timer = calculateElapsedTime(userData.startTime) + (userData.penalties || 0) * 60;
  
  const success = await saveUserData(userId, userData);
  if (success) {
    res.json({ ...userData, timer });
  } else {
    res.status(500).json({ error: 'Failed to start game' });
  }
});

app.post('/api/wrong-code', async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  await ensureDataDirExists();
  let userData = await getUserData(userId);
  
  if (!userData) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Add penalty
  userData.penalties = (userData.penalties || 0) + 1;
  
  // Calculate timer based on startTime and penalties
  let timer = 0;
  if (userData.startTime) {
    timer = calculateElapsedTime(userData.startTime) + userData.penalties * 60;
  }
  
  const success = await saveUserData(userId, userData);
  if (success) {
    res.json({ ...userData, timer, penaltyAdded: true });
  } else {
    res.status(500).json({ error: 'Failed to add penalty' });
  }
});

app.get('/api/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  await ensureDataDirExists();
  const userData = await getUserData(userId);
  
  if (userData) {
    // Calculate timer based on startTime and penalties
    let timer = 0;
    if (userData.startTime) {
      timer = calculateElapsedTime(userData.startTime) + (userData.penalties || 0) * 60;
    }
    res.json({ ...userData, timer });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.post('/api/reset', async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const newUserData = {
    startTime: null,
    stage: 'splash',
    penalties: 0,
    lastTimestamp: Date.now()
  };
  
  const success = await saveUserData(userId, newUserData);
  if (success) {
    res.json({ ...newUserData, timer: 0 });
  } else {
    res.status(500).json({ error: 'Failed to reset game' });
  }
});

// Start the server
app.listen(PORT, async () => {
  await ensureDataDirExists();
  console.log(`Server running on port ${PORT}`);
});
