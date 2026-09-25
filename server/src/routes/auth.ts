import { Request, Response, Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { getUserById, loginUser, registerUser, updateUserWeights } from '../services/authService';

const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }
    const result = await registerUser(name, email, password);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid credentials' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await getUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

router.put('/weights', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { weights } = req.body;
    if (!weights || typeof weights !== 'object') {
      res.status(400).json({ error: 'Weights object is required' });
      return;
    }
    const updatedUser = await updateUserWeights(req.user!.id, weights);
    res.json({ user: updatedUser });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to update priority weights' });
  }
});

export default router;
