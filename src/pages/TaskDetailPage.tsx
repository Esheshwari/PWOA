import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Edit,
  FolderKanban,
  GitBranch,
  Layers,
  RefreshCw,
  RotateCw,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { api } from '../../src/api/client';
import { Task } from '../../src/types';
import { PriorityBadge, RiskBadge, StatusBadge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { CardSkeleton, Skeleton } from '../components/common/Skeleton';
import { DependencyViewer } from '../components/tasks/DependencyViewer';
import { TaskModal } from '../components/tasks/TaskModal';

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [prioritizing, setPrioritizing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadTask();
  }, [id]);

  const loadTask = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [taskRes, allTasksRes] = await Promise.all([api.getTask(id), api.getTasks()]);
      setTask(taskRes.task);
      setAllTasks(allTasksRes.tasks);
    } catch (err: any) {
      setError(err.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrioritize = async () => {
    if (!id) return;
    try {
      setPrioritizing(true);
      const res = await api.prioritizeTask(id);
      setTask(res.task);
    } catch (err: any) {
      console.error(err);
    } finally {
      setPrioritizing(false);
    }
  };

  const handleToggleComplete = async () => {
    if (!task) return;
    try {
      const nextStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
      const res = await api.updateTask(task.id, { status: nextStatus });
      setTask(res.task);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return;
    try {
      await api.deleteTask(task.id);
      navigate('/tasks');
    } catch (err: any) {
      setError(err.message || 'Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-4 shadow-2xs">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-semibold text-slate-800">{error || 'Task not found'}</h3>
        <Button variant="outline" size="sm" onClick={() => navigate('/tasks')}>
          Back to Tasks
        </Button>
      </div>
    );
  }

  const score = Math.round(task.ai_priority_score || 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Back button & Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/tasks')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Tasks</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrioritize}
            loading={prioritizing}
            icon={<RotateCw className={`w-3.5 h-3.5 ${prioritizing ? 'animate-spin' : ''}`} />}
            className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            Re-calculate Priority
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            icon={<Edit className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Edit
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            icon={<Trash2 className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Task Header Card */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={task.ai_priority_label} score={task.ai_priority_score} />
              <StatusBadge status={task.status} />
              <RiskBadge risk={task.ai_deadline_risk} />
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                {task.category}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">{task.title}</h1>

            <p className="text-xs text-slate-500 flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-emerald-600" />
              <span>Project: </span>
              <span className="text-emerald-800 font-semibold">{task.project_name}</span>
            </p>
          </div>

          {/* Quick Score Showcase */}
          <div className="flex items-center gap-4 bg-emerald-50/50 border border-emerald-200/90 rounded-2xl p-4 shrink-0 shadow-2xs">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex flex-col items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <span className="text-2xl font-bold font-mono leading-none">{score}</span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-100 font-semibold mt-0.5">
                Score
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Priority Engine Rating</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Composite of deadline, importance &amp; dependency impact.
              </p>
              <button
                onClick={handleToggleComplete}
                className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {task.status === 'COMPLETED' ? 'Mark as Incomplete' : 'Mark as Completed'}
              </button>
            </div>
          </div>
        </div>

        {/* Task Description */}
        <div className="pt-6 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Description &amp; Specifications
          </h3>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200">
            {task.description || 'No detailed description provided.'}
          </p>
        </div>

        {/* Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Target Deadline</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {task.deadline
                ? new Date(task.deadline).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'None set'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Importance</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">{task.importance}</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Estimated Effort</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {task.estimated_effort} mins (~{(task.estimated_effort / 60).toFixed(1)}h)
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs mb-1">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Manual Baseline</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              {task.manually_assigned_priority || task.importance}
            </p>
          </div>
        </div>
      </Card>

      {/* AI Prioritization Synthesis & Key Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader
            title="Gemini AI Reasoning & Recommended Action"
            subtitle="Context synthesis generated server-side"
          />

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs text-emerald-950 leading-relaxed italic">
                "{task.ai_explanation || 'Priority derived from multi-signal deterministic engine.'}"
              </p>
            </div>

            {task.ai_recommended_action && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-2.5 shadow-2xs">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Recommended Action: </span>
                  {task.ai_recommended_action}
                </div>
              </div>
            )}

            {task.ai_key_factors && task.ai_key_factors.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Key Decision Signals
                </h4>
                <div className="space-y-1.5">
                  {task.ai_key_factors.map((factor, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Live Relational Dependency Manager */}
        <Card>
          <CardHeader
            title="Task Dependencies (Cycle Guarded)"
            subtitle="Manage prerequisites and downstream blockers"
          />
          <DependencyViewer task={task} allTasks={allTasks} onUpdated={loadTask} />
        </Card>
      </div>

      <TaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaved={loadTask}
        initialTask={task}
      />
    </div>
  );
};
