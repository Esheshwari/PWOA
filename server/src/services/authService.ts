import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { execute, queryOne } from '../db/database.js';
import { DEFAULT_WEIGHTS, PriorityWeights } from './priorityService.js';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  priority_weights: PriorityWeights;
  created_at: string;
}

export async function registerUser(name: string, email: string, password: string):Promise<{ user: UserProfile; token: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await queryOne('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  if (existing) {
    throw new Error('An account with this email address already exists.');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const userId = 'usr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const passwordHash = await bcrypt.hash(password, 10);

  await execute(
    `INSERT INTO users (id, name, email, password_hash, priority_weights)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, name.trim(), normalizedEmail, passwordHash, JSON.stringify(DEFAULT_WEIGHTS)]
  );

  // Auto-create a welcome starter project for the new user
  const projectId = 'proj_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  await execute(
    `INSERT INTO projects (id, user_id, name, description, importance, color)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [projectId, userId, 'Default Workspace', 'Primary project workspace for tasks', 'HIGH', '#6366f1']
  );

  const user = await getUserById(userId);
  const token = generateToken(user!);
  return { user: user!, token };
}

export async function loginUser(email: string, password: string): Promise<{ user: UserProfile; token: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const userRecord = await queryOne<any>('SELECT * FROM users WHERE email = $1', [normalizedEmail]);

  if (!userRecord) {
    throw new Error('Invalid email or password.');
  }

  const isMatch = await bcrypt.compare(password, userRecord.password_hash);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  const user = await getUserById(userRecord.id);
  const token = generateToken(user!);
  return { user: user!, token };
}

export async function getUserById(userId: string): Promise<UserProfile | null> {
  const record = await queryOne<any>('SELECT id, name, email, priority_weights, created_at FROM users WHERE id = $1', [userId]);
  if (!record) return null;

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    priority_weights: typeof record.priority_weights === 'string'
      ? JSON.parse(record.priority_weights)
      : record.priority_weights || DEFAULT_WEIGHTS,
    created_at: record.created_at,
  };
}

export async function updateUserWeights(userId: string, weights: Partial<PriorityWeights>): Promise<UserProfile> {
  const current = await getUserById(userId);
  if (!current) throw new Error('User not found');

  const newWeights = {
    ...current.priority_weights,
    ...weights,
  };

  await execute('UPDATE users SET priority_weights = $1 WHERE id = $2', [JSON.stringify(newWeights), userId]);
  return (await getUserById(userId))!;
}

export function generateToken(user: UserProfile): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    config.jwtSecret,
    { expiresIn: '30d' }
  );
}
