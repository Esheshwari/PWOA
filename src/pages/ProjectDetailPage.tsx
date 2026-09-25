import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  FolderKanban,
  GitBranch,
  Layers,
  Plus,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api } from '../../src/api/client';
import { Project, Task } from '../../src/types';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { CardSkeleton } from '../components/common/Skeleton';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskModal } from '../components/tasks/TaskModal';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [prioritizing, setPrioritizing] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    if (id) loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [projRes, tasksRes] = await Promise.all([
        api.getProject(id),
        api.getTasks({ projectId: id, sortBy: 'priority' }),
      ]);
      setProject(projRes.project);
      setTasks(tasksRes.tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrioritizeProject = async () => {
    if (!id) return;
    try {
      setPrioritizing(true);
      await api.prioritizeAll(id);
      await loadProjectData();
    } catch (err) {
      console.error(err);
    } finally {
      setPrioritizing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-xl space-y-4 shadow-2xs">
        <p className="text-slate-700 font-medium">Project not found.</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Back */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </button>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrioritizeProject}
            loading={prioritizing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${prioritizing ? 'animate-spin' : ''}`} />}
            className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            Prioritize Project Tasks
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsTaskModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Project Overview Card */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-4 h-4 rounded-md"
                style={{ backgroundColor: project.color || '#10b981' }}
              />
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {project.importance} IMPORTANCE
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">{project.name}</h1>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              {project.description || 'No detailed description.'}
            </p>
          </div>

          <div className="flex items-center gap-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 shrink-0 shadow-2xs">
            <div>
              <p className="text-xs text-slate-500">Total Deliverables</p>
              <p className="text-2xl font-bold text-slate-900 font-mono">{tasks.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Completed</p>
              <p className="text-2xl font-bold text-emerald-600 font-mono">{completedCount}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Progress</p>
              <p className="text-2xl font-bold text-emerald-700 font-mono">{progressPct}%</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="pt-4">
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPct}%`,
                backgroundColor: project.color || '#10b981',
              }}
            />
          </div>
        </div>
      </Card>

      {/* Tasks in this Project */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          Project Tasks
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
            {tasks.length}
          </span>
        </h3>

        {tasks.length === 0 ? (
          <div className="p-10 text-center bg-white border border-dashed border-slate-200 rounded-2xl shadow-2xs">
            <p className="text-xs text-slate-500">No tasks currently assigned to this project.</p>
            <Button
              size="sm"
              variant="primary"
              className="mt-3 text-xs"
              onClick={() => setIsTaskModalOpen(true)}
            >
              Add First Task
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onUpdated={loadProjectData} />
            ))}
          </div>
        )}
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSaved={loadProjectData}
        defaultProjectId={project.id}
      />
    </div>
  );
};
