import { Response, Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth.js';
import {
  addDependency,
  createTask,
  deleteTask,
  getTaskById,
  getUserTasks,
  prioritizeAllTasks,
  prioritizeTask,
  removeDependency,
  updateTask,
} from '../services/taskService.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId, status, importance, category, search, sortBy } = req.query;
    const tasks = await getUserTasks(req.user!.id, {
      projectId: projectId as string,
      status: status as string,
      importance: importance as string,
      category: category as string,
      search: search as string,
      sortBy: sortBy as string,
    });
    res.json({ tasks });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch tasks' });
  }
});

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      project_id,
      title,
      description,
      status,
      category,
      deadline,
      importance,
      estimated_effort,
      depends_on_ids,
    } = req.body;

    if (!title || !project_id) {
      res.status(400).json({ error: 'Title and project_id are required' });
      return;
    }

    const task = await createTask(req.user!.id, {
      project_id,
      title,
      description,
      status,
      category,
      deadline,
      importance,
      estimated_effort: estimated_effort ? parseInt(estimated_effort, 10) : 60,
      depends_on_ids,
    });

    res.status(201).json({ task });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create task' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await getTaskById(req.params.id, req.user!.id);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json({ task });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch task' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await updateTask(req.params.id, req.user!.id, req.body);
    res.json({ task });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update task' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await deleteTask(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete task' });
  }
});

// Single task prioritization trigger
router.post('/:id/prioritize', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await prioritizeTask(req.params.id, req.user!.id);
    res.json({ task });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Prioritization failed' });
  }
});

// Batch prioritize all tasks
router.post('/prioritize-all', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { projectId } = req.body;
    const result = await prioritizeAllTasks(req.user!.id, projectId);
    res.json({ success: true, prioritized_count: result.count });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Batch prioritization failed' });
  }
});

// Add dependency: task_id depends on depends_on_task_id
router.post('/:id/dependencies', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { depends_on_task_id } = req.body;
    if (!depends_on_task_id) {
      res.status(400).json({ error: 'depends_on_task_id is required' });
      return;
    }

    await addDependency(req.params.id, depends_on_task_id, req.user!.id);
    const updated = await getTaskById(req.params.id, req.user!.id);
    res.json({ task: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to add dependency' });
  }
});

// Remove dependency
router.delete('/:id/dependencies/:dependsOnId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await removeDependency(req.params.id, req.params.dependsOnId, req.user!.id);
    const updated = await getTaskById(req.params.id, req.user!.id);
    res.json({ task: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to remove dependency' });
  }
});

export default router;
