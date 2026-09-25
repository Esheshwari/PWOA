import { query } from '../db/database';

export interface DashboardMetrics {
  summary: {
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    blocked_tasks: number;
    overdue_tasks: number;
    due_soon_tasks: number; // due in next 48h
    critical_priority_tasks: number;
    high_priority_tasks: number;
    total_projects: number;
    completion_rate_percentage: number;
    avg_priority_score: number;
  };
  by_status: { status: string; count: number; percentage: number }[];
  by_priority: { priority: string; count: number; percentage: number }[];
  by_category: { category: string; count: number }[];
  by_deadline_risk: { risk: string; count: number }[];
  bottlenecks: {
    task_id: string;
    title: string;
    status: string;
    blocks_count: number;
    importance: string;
  }[];
  recent_activity: {
    id: string;
    title: string;
    status: string;
    ai_priority_score: number;
    updated_at: string;
  }[];
}

export async function getUserAnalytics(userId: string): Promise<DashboardMetrics> {
  const allTasks = await query<any>(
    `SELECT t.*, p.name as project_name 
     FROM tasks t
     JOIN projects p ON t.project_id = p.id
     WHERE t.user_id = $1`,
    [userId]
  );

  const projects = await query<any>(
    `SELECT id FROM projects WHERE user_id = $1`,
    [userId]
  );

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressTasks = allTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const blockedTasks = allTasks.filter((t) => t.status === 'BLOCKED').length;

  const now = new Date();
  const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const overdueTasks = allTasks.filter((t) => {
    if (t.status === 'COMPLETED' || !t.deadline) return false;
    return new Date(t.deadline).getTime() < now.getTime();
  }).length;

  const dueSoonTasks = allTasks.filter((t) => {
    if (t.status === 'COMPLETED' || !t.deadline) return false;
    const dl = new Date(t.deadline).getTime();
    return dl >= now.getTime() && dl <= next48h.getTime();
  }).length;

  const criticalTasks = allTasks.filter(
    (t) => t.status !== 'COMPLETED' && (t.ai_priority_label === 'CRITICAL' || t.importance === 'CRITICAL')
  ).length;

  const highTasks = allTasks.filter(
    (t) => t.status !== 'COMPLETED' && (t.ai_priority_label === 'HIGH' || t.importance === 'HIGH')
  ).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const activeWithScores = allTasks.filter((t) => t.status !== 'COMPLETED');
  const avgScore =
    activeWithScores.length > 0
      ? Math.round(
          (activeWithScores.reduce((acc, t) => acc + Number(t.ai_priority_score || 0), 0) /
            activeWithScores.length) *
            10
        ) / 10
      : 0;

  // By Status
  const statusCounts: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, BLOCKED: 0, COMPLETED: 0 };
  for (const t of allTasks) {
    if (statusCounts[t.status] !== undefined) statusCounts[t.status]++;
    else statusCounts[t.status] = 1;
  }
  const byStatus = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0,
  }));

  // By Priority Label
  const priorityCounts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const t of allTasks) {
    const label = t.ai_priority_label || t.importance || 'MEDIUM';
    if (priorityCounts[label] !== undefined) priorityCounts[label]++;
  }
  const byPriority = Object.entries(priorityCounts).map(([priority, count]) => ({
    priority,
    count,
    percentage: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0,
  }));

  // By Category
  const categoryCounts: Record<string, number> = {};
  for (const t of allTasks) {
    const cat = t.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }
  const byCategory = Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count,
  }));

  // By Deadline Risk
  const riskCounts: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const t of allTasks.filter((t) => t.status !== 'COMPLETED')) {
    const r = t.ai_deadline_risk || 'LOW';
    if (riskCounts[r] !== undefined) riskCounts[r]++;
  }
  const byDeadlineRisk = Object.entries(riskCounts).map(([risk, count]) => ({
    risk,
    count,
  }));

  // Bottleneck tasks (tasks that block others and are not completed)
  const bottlenecksRaw = await query<any>(
    `SELECT 
      t.id as task_id,
      t.title,
      t.status,
      t.importance,
      COUNT(td.task_id) as blocks_count
     FROM tasks t
     JOIN task_dependencies td ON t.id = td.depends_on_task_id
     WHERE t.user_id = $1 AND t.status != 'COMPLETED'
     GROUP BY t.id
     ORDER BY blocks_count DESC, t.ai_priority_score DESC
     LIMIT 5`,
    [userId]
  );

  const bottlenecks = bottlenecksRaw.map((b) => ({
    task_id: b.task_id,
    title: b.title,
    status: b.status,
    blocks_count: parseInt(b.blocks_count || '0', 10),
    importance: b.importance,
  }));

  // Recent activity
  const recentActivity = allTasks
    .slice()
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6)
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      ai_priority_score: Number(t.ai_priority_score || 0),
      updated_at: t.updated_at,
    }));

  return {
    summary: {
      total_tasks: totalTasks,
      completed_tasks: completedTasks,
      in_progress_tasks: inProgressTasks,
      blocked_tasks: blockedTasks,
      overdue_tasks: overdueTasks,
      due_soon_tasks: dueSoonTasks,
      critical_priority_tasks: criticalTasks,
      high_priority_tasks: highTasks,
      total_projects: projects.length,
      completion_rate_percentage: completionRate,
      avg_priority_score: avgScore,
    },
    by_status: byStatus,
    by_priority: byPriority,
    by_category: byCategory,
    by_deadline_risk: byDeadlineRisk,
    bottlenecks,
    recent_activity: recentActivity,
  };
}
