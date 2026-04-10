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

// 1. API ROUTES (Must come BEFORE the app.get('*') at the bottom)
app.post('/api/analyze', async (req, res) => {
  try {
    const { imageBase64, sourceType, profile } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) return res.status(500).json({ error: 'API key missing on server' });

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Analyze this food image. Source: ${sourceType}. Health issues: ${profile?.healthIssues || 'None'}. Return JSON: {"food_name": "string", "ingredients": ["string"], "nutrition": {"calories": 0, "protein_g": 0, "fat_g": 0, "carbs_g": 0}, "confidence": 0, "health_recommendation": {"should_consume": true, "reason": "string"}}`;

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }] }],
    });

    const text = result.text;
    const jsonStr = text.replace(/```json|```/g, '').trim();
    res.json(JSON.parse(jsonStr));
  } catch (error) {
    console.error("ANALYZE ERROR:", error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

// Standard API routes
app.get('/api/profile', (req, res) => { /* ... existing code ... */ });
app.post('/api/profile', (req, res) => { /* ... existing code ... */ });
app.get('/api/logs', (req, res) => { /* ... existing code ... */ });
app.post('/api/logs', (req, res) => { /* ... existing code ... */ });

// 2. STATIC FILES & SPA FALLBACK (Must be at the VERY BOTTOM)
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
