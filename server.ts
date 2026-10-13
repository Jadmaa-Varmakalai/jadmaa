import 'dotenv/config';
import express from 'express';
import path from 'path';
import { BrevoService } from './server/services/email/brevo.service.js';
import app from './server/app.js';

const PORT = 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Dynamic import to avoid missing module errors in production and isolated typecheck
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    BrevoService.selfTest().catch(err => {
      console.error('[Server] Brevo self-test failed with error:', err);
    });
  });
}

startServer();
