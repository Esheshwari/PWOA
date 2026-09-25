import type { Request, Response } from 'express';
import { createExpressApp } from '../server/src/app.js';
import { validateRuntimeConfig } from '../server/src/config/env.js';
import { runMigrations } from '../server/src/db/migrations.js';
import { runSeeds } from '../server/src/db/seeds.js';

const app = createExpressApp();
let initialization: Promise<void> | undefined;

export default async function handler(req: Request, res: Response): Promise<void> {
  initialization ??= (async () => {
    validateRuntimeConfig();
    await runMigrations();
    await runSeeds();
  })();

  try {
    await initialization;
    app(req, res);
  } catch (error) {
    initialization = undefined;
    console.error('Database initialization error:', error);
    res.status(500).json({ error: 'Database initialization failed.' });
  }
}