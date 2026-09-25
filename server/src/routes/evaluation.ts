import { Response, Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import {
  EVALUATION_BENCHMARK_CASES,
  getLatestEvaluation,
  runEvaluationSuite,
} from '../services/evaluationService';

const router = Router();
router.use(authMiddleware);

// Get current benchmark cases and latest test run
router.get('/latest', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const latest = await getLatestEvaluation(req.user!.id);
    res.json({
      latest,
      benchmark_cases: EVALUATION_BENCHMARK_CASES.map((c) => ({
        id: c.id,
        name: c.name,
        task: c.task,
        expected: c.expected,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch evaluation history' });
  }
});

// Run live evaluation suite against the engine
router.post('/run', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await runEvaluationSuite(req.user!.id);
    res.json({ evaluation: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Evaluation run failed' });
  }
});

export default router;
