import express from 'express';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Extend session type
declare module 'express-session' {
  interface SessionData {
    tokens: any;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'smc-analytics-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: true, 
    sameSite: 'none',
    httpOnly: true 
  }
}));

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyE8l450y2K-fOMkrrpd3BxccIcZI-aCo-9Lrf0ozYsotlaRpRr5vLLMUzpnbGObEg7tQ/exec';

// Proxy for GAS Data
app.get('/api/sheets/data', async (req, res) => {
  try {
    const response = await fetch(`${GAS_URL}?action=getData`);
    if (!response.ok) throw new Error('GAS Fetch Failed');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching from GAS:', error);
    res.status(500).json({ error: 'Failed to fetch data from Google Apps Script' });
  }
});

// Remove OAuth routes as we are using GAS Proxy
app.get('/api/auth/status', (req, res) => {
  res.json({ isAuthenticated: true }); // Always true for GAS proxy mode
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
