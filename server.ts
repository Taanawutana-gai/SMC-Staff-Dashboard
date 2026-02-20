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
    user: {
      name: string;
      position: string;
    };
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.set('trust proxy', 1); // Trust the first proxy (nginx)

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
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    // สร้าง URL โดยใช้ URLSearchParams เพื่อความมาตรฐาน
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
        'Cache-Control': 'no-cache'
      },
      redirect: 'follow'
    });
    
    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).send(`GAS HTTP Error: ${response.status}`);
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

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const params = new URLSearchParams({ action: 'getData' });
    const response = await fetch(`${GAS_URL}?${params.toString()}`);
    const data = await response.json();

    const employees = data.employees || [];
    // Skip header row
    const user = employees.slice(1).find((row: any[]) => {
      const sheetStaffId = String(row[1] || '').trim(); // Column B: staff id
      const sheetName = String(row[2] || '').trim();    // Column C: Name
      const sheetPosition = String(row[5] || '').trim(); // Column F: Position

      const isMatch = sheetName === username && sheetStaffId === password;
      const hasPermission = sheetPosition === 'Operation Manager' || sheetPosition === 'General Manager';

      return isMatch && hasPermission;
    });

    if (user) {
      req.session.user = {
        name: user[2],
        position: user[5]
      };
      
      // Explicitly save session before responding to avoid race conditions
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ error: 'ไม่สามารถบันทึกเซสชันได้' });
        }
        res.json({ success: true, user: req.session.user });
      });
    } else {
      res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าใช้งาน' });
    }
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/auth/status', (req, res) => {
  res.json({ 
    isAuthenticated: !!req.session.user,
    user: req.session.user || null
  });
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
