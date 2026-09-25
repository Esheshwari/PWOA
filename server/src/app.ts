import cors from 'cors';
import express from 'express';
import aiRoutes from './routes/ai';
import analyticsRoutes from './routes/analytics';
import authRoutes from './routes/auth';
import evaluationRoutes from './routes/evaluation';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';

export function createExpressApp(): express.Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // API Route Mounts
  app.use('/api/auth', authRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/evaluations', evaluationRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'PWOA — AI Work Management & Task Prioritization Platform',
      engine: 'PostgreSQL Relational + Gemini 3.8 Flash Hybrid',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
