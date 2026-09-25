import { execute, query, queryOne } from '../db/database.js';

export interface ProjectItem {
  id: string;
  user_id: string;
  name: string;
  description: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  color: string;
  created_at: string;
  updated_at: string;
  task_count: number;
  completed_task_count: number;
  blocked_task_count: number;
  progress_percentage: number;
}

export async function getUserProjects(userId: string): Promise<ProjectItem[]> {
  const sql = `
    SELECT 
      p.*,
      COUNT(t.id) as task_count,
      COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed_task_count,
      COUNT(CASE WHEN t.status = 'BLOCKED' THEN 1 END) as blocked_task_count
    FROM projects p
    LEFT JOIN tasks t ON p.id = t.project_id
    WHERE p.user_id = $1
    GROUP BY p.id
    ORDER BY p.created_at ASC
  `;

  const rows = await query<any>(sql, [userId]);
  return rows.map((r) => {
    const total = parseInt(r.task_count || '0', 10);
    const completed = parseInt(r.completed_task_count || '0', 10);
    const blocked = parseInt(r.blocked_task_count || '0', 10);
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      ...r,
      task_count: total,
      completed_task_count: completed,
      blocked_task_count: blocked,
      progress_percentage: progress,
    };
  });
}

export async function getProjectById(projectId: string, userId: string): Promise<ProjectItem | null> {
  const projects = await getUserProjects(userId);
  return projects.find((p) => p.id === projectId) || null;
}

export async function createProject(
  userId: string,
  data: { name: string; description?: string; importance?: string; color?: string }
): Promise<ProjectItem> {
  const id = 'proj_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const name = data.name.trim();
  const description = data.description?.trim() || '';
  const importance = data.importance || 'MEDIUM';
  const color = data.color || '#3b82f6';

  await execute(
    `INSERT INTO projects (id, user_id, name, description, importance, color)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, userId, name, description, importance, color]
  );

  const created = await getProjectById(id, userId);
  return created!;
}

export async function updateProject(
  projectId: string,
  userId: string,
  data: Partial<{ name: string; description: string; importance: string; color: string }>
): Promise<ProjectItem> {
  const existing = await queryOne('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [projectId, userId]);
  if (!existing) {
    throw new Error('Project not found or unauthorized');
  }

  const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
  const params: any[] = [projectId, userId];

  if (data.name !== undefined) {
    params.push(data.name.trim());
    updates.push(`name = $${params.length}`);
  }
  if (data.description !== undefined) {
    params.push(data.description.trim());
    updates.push(`description = $${params.length}`);
  }
  if (data.importance !== undefined) {
    params.push(data.importance);
    updates.push(`importance = $${params.length}`);
  }
  if (data.color !== undefined) {
    params.push(data.color);
    updates.push(`color = $${params.length}`);
  }

  const sql = `UPDATE projects SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2`;
  await execute(sql, params);

  const updated = await getProjectById(projectId, userId);
  return updated!;
}

export async function deleteProject(projectId: string, userId: string): Promise<void> {
  const existing = await queryOne('SELECT id FROM projects WHERE id = $1 AND user_id = $2', [projectId, userId]);
  if (!existing) {
    throw new Error('Project not found or unauthorized');
  }

  await execute('DELETE FROM projects WHERE id = $1 AND user_id = $2', [projectId, userId]);
}
