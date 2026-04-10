import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'db.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const readDB = () => {
  try {
    if (!fs.existsSync(DB_FILE)) return { profiles: {}, logs: [] };
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { profiles: {}, logs: [] };
  }
};

const writeDB = (data: any) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

function calculateTargets(profile: any) {
  const { weight, height, age, gender, activityLevel } = profile;
  let bmr = gender === 'male' 
    ? (10 * weight + 6.25 * height - 5 * age + 5)
    : (10 * weight + 6.25 * height - 5 * age - 161);

  const multipliers: Record<string, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9
  };

  const tdee = Math.round(bmr * (multipliers[activityLevel] || 1.2));
  return {
    calories: tdee,
    protein_g: Math.round((tdee * 0.30) / 4),
    fat_g: Math.round((tdee * 0.25) / 9),
    carbs_g: Math.round((tdee * 0.45) / 4),
  };
}

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

// CORRECTED: AI Analysis Endpoint
app.post('/api/analyze', async (req, res) => {
  try {
    const { imageBase64, sourceType, profile } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key missing on server' });
    }

    // Using the correct SDK pattern for @google/genai v1.x
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      Analyze this food image. Source: ${sourceType}.
      Health issues: ${profile?.healthIssues || 'None'}.

      Return JSON:
      {
        "food_name": "string",
        "ingredients": ["string"],
        "nutrition": {
          "calories": 0,
          "protein_g": 0,
          "fat_g": 0,
          "carbs_g": 0
        },
        "confidence": 0,
        "health_recommendation": {
          "should_consume": true,
          "reason": "string"
        }
      }
    `;

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: imageBase64,
                mimeType: "image/jpeg",
              },
            },
          ],
        },
      ],
    });

    const text = result.text; // Use the text getter
    if (!text) throw new Error('No response from AI');
    
    const jsonStr = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(jsonStr));
  } catch (error) {
    console.error("ANALYZE ERROR:", error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
}

startServer();
