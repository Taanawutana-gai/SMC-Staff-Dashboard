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

const GAS_URL = process.env.GAS_URL || 'https://script.google.com/macros/s/AKfycbyvRUhqBoxy7NuozelXiI2azcpSo0pwI7A8TJJfMNZEt-mwVtq8Z7QvXD-5m-aVGu9LyA/exec';

// Proxy for GAS Data
app.get('/api/sheets/data', async (req, res) => {
  if (!process.env.GAS_URL && GAS_URL.includes('AKfycbyvRUhqBoxy7NuozelXiI2azcpSo0pwI7A8TJJfMNZEt-mwVtq8Z7QvXD-5m-aVGu9LyA')) {
    console.log('Using user-provided GAS URL.');
  }

  try {
    const params = new URLSearchParams({
      action: 'getData',
      t: Date.now().toString()
    });
    const targetUrl = `${GAS_URL}?${params.toString()}`;
    
    console.log('Fetching from GAS:', targetUrl);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      redirect: 'follow'
    });
    
    const text = await response.text();

    if (!response.ok) {
      console.error(`GAS Error Response (${response.status}):`, text);
      return res.status(response.status).json({ 
        error: 'GAS_FETCH_ERROR', 
        status: response.status,
        message: text.substring(0, 500) // Send part of the error body for debugging
      });
    }

    try {
      const data = JSON.parse(text);
      if (data.error) {
        return res.status(500).json({ error: 'GAS Script Error', details: data.details });
      }
      res.json(data);
    } catch (parseError) {
      console.error('JSON Parse Error. Content starts with:', text.substring(0, 150));
      
      if (text.includes('<!doctype html>') || text.includes('<html')) {
        const titleMatch = text.match(/<title>(.*?)<\/title>/i);
        const pageTitle = titleMatch ? titleMatch[1] : 'ไม่ทราบชื่อหน้า';
        
        return res.status(500).send(`GAS ยังคงส่งคืนหน้า HTML (ชื่อหน้า: "${pageTitle}") แทนที่จะเป็น JSON. คำแนะนำ: กรุณาตรวจสอบว่าคุณได้เลือก "New Version" ตอนกด Deploy ใน GAS แล้วหรือยัง หากเลือกแล้วแต่ยังไม่ได้ผล ให้ลองเปิด URL ของ GAS ใน Browser โดยตรงแล้วเติม ?action=getData เพื่อดูว่าได้ JSON หรือไม่`);
      }
      return res.status(500).send('ข้อมูลจาก GAS ไม่อยู่ในรูปแบบ JSON ที่ถูกต้อง');
    }
  } catch (error: any) {
    console.error('Proxy Error:', error);
    res.status(500).json({ error: 'Server Proxy Error', details: error.message });
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
