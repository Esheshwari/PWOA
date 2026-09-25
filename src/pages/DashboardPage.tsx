import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  FolderKanban,
  GitBranch,
  Layers,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { api } from '../../src/api/client';
import { DashboardMetrics, Project, Task } from '../../src/types';
import { PriorityBadge, RiskBadge, StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { CardSkeleton, Skeleton } from '../components/common/Skeleton';
import { TaskModal } from '../components/tasks/TaskModal';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const context = useOutletContext<{ refreshKey?: number; triggerRefresh?: () => void }>();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [topTasks, setTopTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [prioritizingAll, setPrioritizingAll] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [context?.refreshKey]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, tasksRes, projRes] = await Promise.all([
        api.getAnalytics(),
        api.getTasks({ sortBy: 'priority' }),
        api.getProjects(),
      ]);

      setMetrics(analyticsRes.analytics);
      setTopTasks(tasksRes.tasks.filter((t) => t.status !== 'COMPLETED').slice(0, 6));
      setProjects(projRes.projects);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrioritizeAll = async () => {
    try {
      setPrioritizingAll(true);
      await api.prioritizeAll();
      await loadDashboardData();
      if (context?.triggerRefresh) context.triggerRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setPrioritizingAll(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const s = metrics?.summary;

  return (
    <div className="space-y-8 pb-10">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            Productivity Dashboard
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              Live Priority Graph
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time task prioritization powered by deterministic scoring &amp; Gemini 3.8 Flash.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrioritizeAll}
            loading={prioritizingAll}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${prioritizingAll ? 'animate-spin' : ''}`} />}
            className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            Run Priority Engine
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsTaskModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* Summary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Total Tasks</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{s?.total_tasks || 0}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across {s?.total_projects || 0} projects</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">
            {s?.completed_tasks || 0}
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${s?.completion_rate_percentage || 0}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{s?.completion_rate_percentage || 0}% completion</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Due in 48h</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {s?.due_soon_tasks || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Upcoming deadline window</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Overdue</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div
            className={`text-2xl font-bold font-mono ${
              (s?.overdue_tasks || 0) > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'
            }`}
          >
            {s?.overdue_tasks || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requires immediate triage</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Critical / High</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono">
            {(s?.critical_priority_tasks || 0) + (s?.high_priority_tasks || 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">High business impact</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Blocked Tasks</span>
            <GitBranch className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {s?.blocked_tasks || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Waiting on dependencies</p>
        </div>
      </div>

      {/* Main Grid: AI Priority Focus (Left 2 cols) & Analytics / Bottlenecks (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Prioritized Task Action Queue */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="AI Recommended Priority Queue"
              subtitle="Ordered by combined deterministic score & LLM synthesis"
              action={
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/tasks')}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs text-emerald-700 hover:text-emerald-800"
                >
                  View All
                </Button>
              }
            />

            <div className="space-y-3">
              {topTasks.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-slate-700">All active tasks completed!</p>
                  <p className="text-xs text-slate-400 mt-1">Create a new task to resume planning.</p>
                </div>
              ) : (
                topTasks.map((t, idx) => (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/tasks/${t.id}`)}
                    className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3">
                      {/* Priority Ranking Rank Badge */}
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center text-emerald-800 font-mono shrink-0">
                        <span className="text-xs font-bold leading-none">{idx + 1}</span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <PriorityBadge priority={t.ai_priority_label} score={t.ai_priority_score} />
                          <RiskBadge risk={t.ai_deadline_risk} />
                          <span className="text-[11px] text-slate-500 font-mono">
                            {t.project_name}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {t.title}
                        </h4>

                        {t.ai_recommended_action && (
                          <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5 italic">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>{t.ai_recommended_action}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 text-xs shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={t.status} />
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {t.estimated_effort}m (~{(t.estimated_effort / 60).toFixed(1)}h)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Quick AI Assistant Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white border border-emerald-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Ask AI Work Assistant</h4>
                <p className="text-xs text-slate-600">
                  "I have 2 hours. What should I finish?" or "What is causing my backlog?"
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/ai-assistant')}
              icon={<ArrowRight className="w-4 h-4" />}
              className="shrink-0 text-xs"
            >
              Open Assistant
            </Button>
          </div>
        </div>

        {/* Right Column: Visual Charts & Critical Bottlenecks */}
        <div className="space-y-6">
          {/* Status Breakdown Distribution */}
          <Card>
            <CardHeader title="Task Status Allocation" subtitle="Real-time relational distribution" />
            <div className="space-y-3">
              {metrics?.by_status.map((item) => (
                <div key={item.status} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-semibold">{item.status}</span>
                    <span className="text-slate-500 font-mono">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-500'
                          : item.status === 'IN_PROGRESS'
                          ? 'bg-teal-500'
                          : item.status === 'BLOCKED'
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Critical Path & Bottlenecks */}
          <Card>
            <CardHeader
              title="Critical Path Blockers"
              subtitle="Tasks holding up downstream workstreams"
            />
            <div className="space-y-2.5">
              {(!metrics?.bottlenecks || metrics.bottlenecks.length === 0) ? (
                <p className="text-xs text-slate-400 italic py-3 text-center">
                  No active bottlenecks detected! All dependencies cleared.
                </p>
              ) : (
                metrics.bottlenecks.map((b) => (
                  <div
                    key={b.task_id}
                    onClick={() => navigate(`/tasks/${b.task_id}`)}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-amber-400 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-rose-600 flex items-center gap-1 font-mono text-[11px]">
                        <GitBranch className="w-3.5 h-3.5" />
                        Blocks {b.blocks_count} task(s)
                      </span>
                      <StatusBadge status={b.status as any} />
                    </div>
                    <p className="text-xs text-slate-900 truncate font-semibold">{b.title}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Active Projects Quick List */}
          <Card>
            <CardHeader
              title="Active Workspaces"
              action={
                <button
                  onClick={() => navigate('/projects')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold"
                >
                  View All
                </button>
              }
            />
            <div className="space-y-2.5">
              {projects.slice(0, 3).map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-emerald-300 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800 truncate pr-2">{p.name}</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {p.completed_task_count || 0}/{p.task_count || 0}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${p.progress_percentage || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSaved={loadDashboardData}
      />
    </div>
  );
};
