import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

app.use(cors());
app.use(express.json());

// Helper to read/write DB
const readDB = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { profiles: {}, logs: [] };
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading DB:', error);
    return { profiles: {}, logs: [] };
  }
};
const writeDB = (data: any) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing DB:', error);
  }
};

// Mifflin-St Jeor Equation
function calculateTargets(profile: any) {
  const { weight, height, age, gender, activityLevel } = profile;
  let bmr;
  if (gender === 'male') {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.2));
  
  // Macros: 30% Protein, 25% Fat, 45% Carbs
  // Protein: 4 cal/g, Fat: 9 cal/g, Carbs: 4 cal/g
  return {
    calories: tdee,
    protein_g: Math.round((tdee * 0.30) / 4),
    fat_g: Math.round((tdee * 0.25) / 9),
    carbs_g: Math.round((tdee * 0.45) / 4),
  };
}

// API Routes
app.get('/api/profile', (req, res) => {
  const db = readDB();
  res.json(db.profiles.default || null);
});

app.post('/api/profile', (req, res) => {
  const profile = req.body;
  const targets = calculateTargets(profile);
  const updatedProfile = { ...profile, targets };
  const db = readDB();
  db.profiles.default = updatedProfile;
  writeDB(db);
  res.json(updatedProfile);
});

app.get('/api/logs', (req, res) => {
  const db = readDB();
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = db.logs.filter((log: any) => log.timestamp.startsWith(today));
  res.json(todayLogs);
});

app.post('/api/logs', (req, res) => {
  const log = { ...req.body, id: Date.now().toString(), timestamp: new Date().toISOString() };
  const db = readDB();
  db.logs.push(log);
  writeDB(db);
  res.json(log);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
