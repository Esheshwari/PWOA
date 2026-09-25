import { execute, query, queryOne } from '../db/database.js';
import { generateAITaskPriority } from './aiService.js';
import { calculateDeterministicPriority, PriorityWeights } from './priorityService.js';

export interface TaskItem {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
  category: string;
  deadline: string | null;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimated_effort: number;
  manually_assigned_priority: string;
  ai_priority_score: number;
  ai_priority_label: string;
  ai_explanation: string;
  ai_deadline_risk: string;
  ai_recommended_action: string;
  ai_key_factors: string[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  project_name?: string;
  project_importance?: string;
  project_color?: string;
  dependencies?: { id: string; title: string; status: string }[];
  blocked_tasks?: { id: string; title: string; status: string }[];
}

export async function getUserTasks(
  userId: string,
  filters: {
    projectId?: string;
    status?: string;
    importance?: string;
    category?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}
): Promise<TaskItem[]> {
  let sql = `
    SELECT 
      t.*,
      p.name as project_name,
      p.importance as project_importance,
      p.color as project_color
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.user_id = $1
  `;
  const params: any[] = [userId];

  if (filters.projectId) {
    params.push(filters.projectId);
    sql += ` AND t.project_id = $${params.length}`;
  }

  if (filters.status) {
    params.push(filters.status);
    sql += ` AND t.status = $${params.length}`;
  }

  if (filters.importance) {
    params.push(filters.importance);
    sql += ` AND t.importance = $${params.length}`;
  }

  if (filters.category) {
    params.push(filters.category);
    sql += ` AND t.category = $${params.length}`;
  }

  if (filters.search) {
    params.push(`%${filters.search}%`);
    sql += ` AND (t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`;
  }

  // Sorting
  const sortMap: Record<string, string> = {
    priority: 't.ai_priority_score DESC, t.deadline ASC NULLS LAST',
    deadline: 't.deadline ASC NULLS LAST',
    created: 't.created_at DESC',
    importance: 'CASE t.importance WHEN \'CRITICAL\' THEN 1 WHEN \'HIGH\' THEN 2 WHEN \'MEDIUM\' THEN 3 ELSE 4 END',
    effort: 't.estimated_effort ASC',
  };

  const sortClause = sortMap[filters.sortBy || 'priority'] || 't.ai_priority_score DESC, t.deadline ASC NULLS LAST';
  sql += ` ORDER BY ${sortClause}`;

  const tasks = await query<any>(sql, params);

  // Fetch all dependencies for user
  const allDeps = await query<any>(`
    SELECT td.task_id, td.depends_on_task_id, dt.title as depends_on_title, dt.status as depends_on_status
    FROM task_dependencies td
    JOIN tasks dt ON td.depends_on_task_id = dt.id
    WHERE dt.user_id = $1
  `, [userId]);

  const depsMap = new Map<string, { id: string; title: string; status: string }[]>();
  const reverseDepsMap = new Map<string, { id: string; title: string; status: string }[]>();

  for (const d of allDeps) {
    // d.task_id depends on d.depends_on_task_id
    if (!depsMap.has(d.task_id)) depsMap.set(d.task_id, []);
    depsMap.get(d.task_id)!.push({
      id: d.depends_on_task_id,
      title: d.depends_on_title,
      status: d.depends_on_status,
    });

    // reverse: d.depends_on_task_id blocks d.task_id
    if (!reverseDepsMap.has(d.depends_on_task_id)) reverseDepsMap.set(d.depends_on_task_id, []);
    reverseDepsMap.get(d.depends_on_task_id)!.push({
      id: d.task_id,
      title: '', // will be populated
      status: '',
    });
  }

  // Populate title for blocked tasks
  const taskTitleMap = new Map<string, { title: string; status: string }>();
  for (const t of tasks) {
    taskTitleMap.set(t.id, { title: t.title, status: t.status });
  }

  for (const [_, blockedList] of reverseDepsMap.entries()) {
    for (const b of blockedList) {
      const info = taskTitleMap.get(b.id);
      if (info) {
        b.title = info.title;
        b.status = info.status;
      }
    }
  }

  return tasks.map((t) => ({
    ...t,
    ai_priority_score: Number(t.ai_priority_score || 0),
    estimated_effort: Number(t.estimated_effort || 60),
    ai_key_factors: Array.isArray(t.ai_key_factors)
      ? t.ai_key_factors
      : typeof t.ai_key_factors === 'string'
      ? JSON.parse(t.ai_key_factors)
      : [],
    dependencies: depsMap.get(t.id) || [],
    blocked_tasks: reverseDepsMap.get(t.id) || [],
  }));
}

export async function getTaskById(taskId: string, userId: string): Promise<TaskItem | null> {
  const tasks = await getUserTasks(userId);
  const found = tasks.find((t) => t.id === taskId);
  return found || null;
}

export async function createTask(
  userId: string,
  data: {
    project_id: string;
    title: string;
    description?: string;
    status?: string;
    category?: string;
    deadline?: string | null;
    importance?: string;
    estimated_effort?: number;
    manually_assigned_priority?: string;
    depends_on_ids?: string[];
  }
): Promise<TaskItem> {
  // Validate project belongs to user
  const proj = await queryOne('SELECT id, name, importance FROM projects WHERE id = $1 AND user_id = $2', [
    data.project_id,
    userId,
  ]);
  if (!proj) {
    throw new Error('Project not found or unauthorized');
  }

  const taskId = 'task_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

  await execute(
    `INSERT INTO tasks (
      id, project_id, user_id, title, description, status, category,
      deadline, importance, estimated_effort, manually_assigned_priority
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      taskId,
      data.project_id,
      userId,
      data.title.trim(),
      data.description || '',
      data.status || 'TODO',
      data.category || 'Feature',
      data.deadline ? new Date(data.deadline).toISOString() : null,
      data.importance || 'MEDIUM',
      data.estimated_effort || 60,
      data.manually_assigned_priority || data.importance || 'MEDIUM',
    ]
  );

  // Add initial dependencies if provided
  if (data.depends_on_ids && data.depends_on_ids.length > 0) {
    for (const depId of data.depends_on_ids) {
      if (depId && depId !== taskId) {
        await addDependency(taskId, depId, userId);
      }
    }
  }

  // Calculate and store initial priority
  await prioritizeTask(taskId, userId);

  const created = await getTaskById(taskId, userId);
  return created!;
}

export async function updateTask(
  taskId: string,
  userId: string,
  data: Partial<{
    project_id: string;
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
    category: string;
    deadline: string | null;
    importance: string;
    estimated_effort: number;
    manually_assigned_priority: string;
  }>
): Promise<TaskItem> {
  const existing = await queryOne<{ id: string; status: string }>('SELECT id, status FROM tasks WHERE id = $1 AND user_id = $2', [
    taskId,
    userId,
  ]);
  if (!existing) {
    throw new Error('Task not found or unauthorized');
  }

  const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
  const params: any[] = [taskId, userId];

  if (data.title !== undefined) {
    params.push(data.title.trim());
    updates.push(`title = $${params.length}`);
  }
  if (data.description !== undefined) {
    params.push(data.description);
    updates.push(`description = $${params.length}`);
  }
  if (data.status !== undefined) {
    params.push(data.status);
    updates.push(`status = $${params.length}`);
    if (data.status === 'COMPLETED') {
      updates.push(`completed_at = CURRENT_TIMESTAMP`);
    } else {
      updates.push(`completed_at = NULL`);
    }
  }
  if (data.category !== undefined) {
    params.push(data.category);
    updates.push(`category = $${params.length}`);
  }
  if (data.deadline !== undefined) {
    params.push(data.deadline ? new Date(data.deadline).toISOString() : null);
    updates.push(`deadline = $${params.length}`);
  }
  if (data.importance !== undefined) {
    params.push(data.importance);
    updates.push(`importance = $${params.length}`);
  }
  if (data.estimated_effort !== undefined) {
    params.push(data.estimated_effort);
    updates.push(`estimated_effort = $${params.length}`);
  }
  if (data.manually_assigned_priority !== undefined) {
    params.push(data.manually_assigned_priority);
    updates.push(`manually_assigned_priority = $${params.length}`);
  }
  if (data.project_id !== undefined) {
    params.push(data.project_id);
    updates.push(`project_id = $${params.length}`);
  }

  const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2`;
  await execute(sql, params);

  // Recalculate priority automatically when relevant fields change
  await prioritizeTask(taskId, userId);

  const updated = await getTaskById(taskId, userId);
  return updated!;
}

export async function deleteTask(taskId: string, userId: string): Promise<void> {
  const existing = await queryOne('SELECT id FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
  if (!existing) {
    throw new Error('Task not found or unauthorized');
  }

  await execute('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [taskId, userId]);
}

// ----------------- DEPENDENCIES & CYCLE DETECTION -----------------

export async function addDependency(taskId: string, dependsOnTaskId: string, userId: string): Promise<void> {
  if (taskId === dependsOnTaskId) {
    throw new Error('Invalid dependency: A task cannot depend on itself.');
  }

  // Check both tasks belong to the user
  const tasks = await query<{ id: string }>(
    'SELECT id FROM tasks WHERE id IN ($1, $2) AND user_id = $3',
    [taskId, dependsOnTaskId, userId]
  );
  if (tasks.length < 2) {
    throw new Error('One or both tasks not found or unauthorized.');
  }

  // Check if relationship already exists
  const existing = await queryOne(
    'SELECT task_id FROM task_dependencies WHERE task_id = $1 AND depends_on_task_id = $2',
    [taskId, dependsOnTaskId]
  );
  if (existing) {
    throw new Error('This dependency relationship already exists.');
  }

  // Cycle Detection: Check if dependsOnTaskId already transitively depends on taskId!
  // If dependsOnTaskId reaches taskId via dependency edges, adding taskId -> dependsOnTaskId causes a cycle!
  const hasCycle = await checkTransitiveDependency(dependsOnTaskId, taskId, userId);
  if (hasCycle) {
    throw new Error('Circular dependency detected: Adding this dependency would create an infinite loop.');
  }

  await execute(
    'INSERT INTO task_dependencies (task_id, depends_on_task_id) VALUES ($1, $2)',
    [taskId, dependsOnTaskId]
  );

  // Trigger priority re-calculation for both tasks
  await prioritizeTask(taskId, userId);
  await prioritizeTask(dependsOnTaskId, userId);
}

export async function removeDependency(taskId: string, dependsOnTaskId: string, userId: string): Promise<void> {
  await execute(
    `DELETE FROM task_dependencies 
     WHERE task_id = $1 AND depends_on_task_id = $2
     AND task_id IN (SELECT id FROM tasks WHERE user_id = $3)`,
    [taskId, dependsOnTaskId, userId]
  );

  await prioritizeTask(taskId, userId);
  await prioritizeTask(dependsOnTaskId, userId);
}

async function checkTransitiveDependency(startTaskId: string, targetTaskId: string, userId: string): Promise<boolean> {
  // BFS search in dependency graph
  const allDeps = await query<{ task_id: string; depends_on_task_id: string }>(`
    SELECT td.task_id, td.depends_on_task_id 
    FROM task_dependencies td
    JOIN tasks t ON td.task_id = t.id
    WHERE t.user_id = $1
  `, [userId]);

  const adj = new Map<string, string[]>();
  for (const d of allDeps) {
    if (!adj.has(d.task_id)) adj.set(d.task_id, []);
    adj.get(d.task_id)!.push(d.depends_on_task_id);
  }

  const visited = new Set<string>();
  const queue = [startTaskId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === targetTaskId) {
      return true; // found cycle
    }
    if (!visited.has(current)) {
      visited.add(current);
      const neighbors = adj.get(current) || [];
      for (const n of neighbors) {
        if (!visited.has(n)) {
          queue.push(n);
        }
      }
    }
  }

  return false;
}

// ----------------- PRIORITIZATION ENGINE ORCHESTRATION -----------------

export async function prioritizeTask(taskId: string, userId: string): Promise<TaskItem> {
  const user = await queryOne<{ priority_weights: any }>('SELECT priority_weights FROM users WHERE id = $1', [userId]);
  const userWeights = typeof user?.priority_weights === 'string'
    ? JSON.parse(user.priority_weights)
    : user?.priority_weights || {};

  const taskData = await queryOne<any>(`
    SELECT 
      t.*,
      p.name as project_name,
      p.importance as project_importance
    FROM tasks t
    JOIN projects p ON t.project_id = p.id
    WHERE t.id = $1 AND t.user_id = $2
  `, [taskId, userId]);

  if (!taskData) {
    throw new Error('Task not found');
  }

  // Count downstream blocked tasks
  const downstream = await query<{ count: string }>(`
    SELECT COUNT(*) as count 
    FROM task_dependencies td
    JOIN tasks t ON td.task_id = t.id
    WHERE td.depends_on_task_id = $1 AND t.status != 'COMPLETED'
  `, [taskId]);
  const blockedDownstreamCount = parseInt(downstream[0]?.count || '0', 10);

  // Count unresolved upstream prerequisites
  const upstream = await query<{ count: string }>(`
    SELECT COUNT(*) as count 
    FROM task_dependencies td
    JOIN tasks t ON td.depends_on_task_id = t.id
    WHERE td.task_id = $1 AND t.status != 'COMPLETED'
  `, [taskId]);
  const unresolvedDependenciesCount = parseInt(upstream[0]?.count || '0', 10);

  // Deterministic scoring calculation
  const deterministicResult = calculateDeterministicPriority(
    {
      id: taskData.id,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      category: taskData.category,
      deadline: taskData.deadline,
      importance: taskData.importance,
      estimated_effort: taskData.estimated_effort,
      project_name: taskData.project_name,
      project_importance: taskData.project_importance,
      blocked_downstream_count: blockedDownstreamCount,
      unresolved_dependencies_count: unresolvedDependenciesCount,
    },
    userWeights
  );

  // AI Structured Synthesis with Gemini
  const aiResult = await generateAITaskPriority(
    {
      id: taskData.id,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status,
      category: taskData.category,
      deadline: taskData.deadline,
      importance: taskData.importance,
      estimated_effort: taskData.estimated_effort,
      project_name: taskData.project_name,
      project_importance: taskData.project_importance,
      blocked_downstream_count: blockedDownstreamCount,
      unresolved_dependencies_count: unresolvedDependenciesCount,
    },
    deterministicResult
  );

  // Persist AI/Deterministic results in tasks table
  await execute(`
    UPDATE tasks SET
      ai_priority_score = $1,
      ai_priority_label = $2,
      ai_explanation = $3,
      ai_deadline_risk = $4,
      ai_recommended_action = $5,
      ai_key_factors = $6,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $7 AND user_id = $8
  `, [
    aiResult.combined_score,
    aiResult.priority_label,
    aiResult.reasoning,
    aiResult.deadline_risk,
    aiResult.recommended_action,
    JSON.stringify(aiResult.key_factors),
    taskId,
    userId,
  ]);

  // Insert audit record in task_priority_results
  const resultId = 'pr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  await execute(`
    INSERT INTO task_priority_results (
      id, task_id, deterministic_score, ai_score, priority_label,
      deadline_risk, reasoning, recommended_action, key_factors, signals
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `, [
    resultId,
    taskId,
    deterministicResult.deterministic_score,
    aiResult.combined_score,
    aiResult.priority_label,
    aiResult.deadline_risk,
    aiResult.reasoning,
    aiResult.recommended_action,
    JSON.stringify(aiResult.key_factors),
    JSON.stringify(deterministicResult.signals),
  ]);

  const updated = await getTaskById(taskId, userId);
  return updated!;
}

export async function prioritizeAllTasks(userId: string, projectId?: string): Promise<{ count: number }> {
  let sql = 'SELECT id FROM tasks WHERE user_id = $1';
  const params: any[] = [userId];

  if (projectId) {
    params.push(projectId);
    sql += ' AND project_id = $2';
  }

  const tasks = await query<{ id: string }>(sql, params);
  for (const t of tasks) {
    try {
      await prioritizeTask(t.id, userId);
    } catch (err) {
      console.error(`Failed to prioritize task ${t.id}:`, err);
    }
  }

  return { count: tasks.length };
}
