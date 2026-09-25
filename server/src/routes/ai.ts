import { Response, Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { askAIAssistant } from '../services/aiService';
import { getUserProjects } from '../services/projectService';
import { getUserTasks } from '../services/taskService';

const router = Router();
router.use(authMiddleware);

router.post('/chat', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }

    const tasks = await getUserTasks(req.user!.id);
    const projects = await getUserProjects(req.user!.id);

    const answer = await askAIAssistant({
      tasks,
      projects,
      userQuery: prompt,
    });

    res.json({ answer });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI assistant error' });
  }
});

export default router;
