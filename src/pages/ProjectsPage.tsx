import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  GitBranch,
  Layers,
  Plus,
  Trash2,
  Zap,
} from 'lucide-react';
import { api } from '../../src/api/client';
import { Project, TaskImportance } from '../../src/types';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input, Select, Textarea } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { CardSkeleton } from '../components/common/Skeleton';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New project form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState<TaskImportance>('MEDIUM');
  const [color, setColor] = useState('#6366f1');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const res = await api.getProjects();
      setProjects(res.projects);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      await api.createProject({
        name: name.trim(),
        description: description.trim(),
        importance,
        color,
      });
      setIsCreateModalOpen(false);
      setName('');
      setDescription('');
      await loadProjects();
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete project "${projName}" and all associated tasks?`)) return;
    try {
      await api.deleteProject(projectId);
      await loadProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Project Workspaces
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              {projects.length} Active
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize business initiatives and prioritize tasks across workstreams.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          icon={<Plus className="w-3.5 h-3.5" />}
          className="text-xs"
        >
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white shadow-2xs">
          <FolderKanban className="w-10 h-10 mx-auto text-emerald-600 mb-2 opacity-80" />
          <p className="text-sm font-semibold text-slate-700">No projects created yet</p>
          <p className="text-xs text-slate-400 mt-1">Create your first project to begin adding deliverables.</p>
          <Button
            size="sm"
            variant="primary"
            className="mt-4"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="group bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:shadow-emerald-500/5 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-md shrink-0"
                      style={{ backgroundColor: p.color || '#10b981' }}
                    />
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {p.importance}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteProject(p.id, p.name, e)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-2">
                  {p.name}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                  {p.description || 'No description provided.'}
                </p>
              </div>

              {/* Progress & Stats */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Progress</span>
                  <span className="font-mono text-slate-800 font-bold">
                    {p.progress_percentage || 0}%
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${p.progress_percentage || 0}%`,
                      backgroundColor: p.color || '#10b981',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    {p.task_count || 0} tasks
                  </span>

                  <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {p.completed_task_count || 0} done
                  </span>

                  {(p.blocked_task_count || 0) > 0 && (
                    <span className="flex items-center gap-1 text-amber-600 font-mono text-[10px] font-semibold">
                      <GitBranch className="w-3 h-3" />
                      {p.blocked_task_count} blocked
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Project"
        subtitle="Group related deliverables and assign project importance weight."
        maxWidth="md"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Input
            label="Project Name *"
            placeholder="e.g. SOC-2 Compliance Audit"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Textarea
            label="Description"
            placeholder="Goal, target milestones, context..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Project Criticality"
              value={importance}
              onChange={(e) => setImportance(e.target.value as TaskImportance)}
              options={[
                { value: 'CRITICAL', label: 'CRITICAL' },
                { value: 'HIGH', label: 'HIGH' },
                { value: 'MEDIUM', label: 'MEDIUM' },
                { value: 'LOW', label: 'LOW' },
              ]}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Accent Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-9 p-0.5 rounded-lg bg-white border border-slate-200 cursor-pointer shadow-2xs"
                />
                <span className="text-xs text-slate-500 font-mono">{color}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
