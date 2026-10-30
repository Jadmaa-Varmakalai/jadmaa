import 'dotenv/config';
import express from 'express';
import path from 'path';
import { BrevoService } from './server/services/email/brevo.service.js';
import app from './server/app.js';

const PORT = 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // @ts-ignore
    const { createServer: createViteServer } = await (import('' + 'vite') as Promise<any>);
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
    app.use(express.static(distPath, {
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        if (filePath.includes('assets') || filePath.includes('optimized') || filePath.includes('blog')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (/\.(webp|avif|png|jpe?g|svg|woff2?)$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=86400');
        }
      }
    }));
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
