import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Proxy for GAS Data
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbyvRUhqBoxy7NuozelXiI2azcpSo0pwI7A8TJJfMNZEt-mwVtq8Z7QvXD-5m-aVGu9LyA/exec';

  app.get('/api/sheets/data', async (req, res) => {
    try {
      const params = new URLSearchParams({
        action: 'getData',
        t: Date.now().toString()
      });
      const targetUrl = `${GAS_URL}?${params.toString()}`;
      
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow'
      });
      
      const text = await response.text();

      if (!response.ok) {
        return res.status(response.status).json({ 
          error: 'GAS_FETCH_ERROR', 
          status: response.status,
          message: text.substring(0, 500)
        });
      }

      try {
        const data = JSON.parse(text);
        res.json(data);
      } catch (e) {
        res.status(500).json({ error: 'INVALID_JSON', details: text.substring(0, 200) });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'SERVER_ERROR', message: error.message });
    }
  });

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
