import { Response, Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import { getUserAnalytics } from '../services/analyticsService.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const analytics = await getUserAnalytics(req.user!.id);
    res.json({ analytics });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch analytics' });
  }
});

export default router;
