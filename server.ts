import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createExpressApp } from './server/src/app';
import { config, validateRuntimeConfig } from './server/src/config/env';
import { runMigrations } from './server/src/db/migrations';
import { runSeeds } from './server/src/db/seeds';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log('Initializing PWOA AI Work Management Platform...');
  validateRuntimeConfig();

  // 1. Run PostgreSQL database migrations
  try {
    await runMigrations();
    await runSeeds();
  } catch (err) {
    console.error('Database migration/seed error:', err);
  }

  // 2. Initialize Express application with REST APIs
  const app = createExpressApp();

  // 3. Frontend Integration
  const isProduction = process.env.NODE_ENV === 'production';
  const port = config.port;

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // In development, hook Vite middleware directly
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening at http://0.0.0.0:${port}`);
    console.log(`API endpoints accessible under /api/*`);
  });

  return server;
}

startServer().catch((err) => {
  console.error('Fatal server boot failure:', err);
  process.exit(1);
});

