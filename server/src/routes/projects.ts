import { Response, Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { createProject, deleteProject, getProjectById, getUserProjects, updateProject } from '../services/projectService';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const projects = await getUserProjects(req.user!.id);
    res.json({ projects });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch projects' });
  }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, importance, color } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Project name is required' });
      return;
    }
    const project = await createProject(req.user!.id, { name, description, importance, color });
    res.status(201).json({ project });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create project' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await getProjectById(req.params.id, req.user!.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json({ project });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch project' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const project = await updateProject(req.params.id, req.user!.id, req.body);
    res.json({ project });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update project' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await deleteProject(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Project and associated tasks deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete project' });
  }
});

export default router;
