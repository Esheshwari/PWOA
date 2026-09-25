import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Project, Task, TaskImportance, TaskStatus } from '../../types';
import { Alert } from '../common/Alert';
import { Button } from '../common/Button';
import { Input, Select, Textarea } from '../common/Input';
import { Modal } from '../common/Modal';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialTask?: Task | null;
  defaultProjectId?: string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialTask,
  defaultProjectId,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [category, setCategory] = useState('Feature');
  const [importance, setImportance] = useState<TaskImportance>('MEDIUM');
  const [deadline, setDeadline] = useState('');
  const [estimatedEffort, setEstimatedEffort] = useState(60);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadContextData();
      if (initialTask) {
        setTitle(initialTask.title);
        setProjectId(initialTask.project_id);
        setDescription(initialTask.description || '');
        setStatus(initialTask.status);
        setCategory(initialTask.category || 'Feature');
        setImportance(initialTask.importance);
        setEstimatedEffort(initialTask.estimated_effort || 60);
        if (initialTask.deadline) {
          const d = new Date(initialTask.deadline);
          setDeadline(d.toISOString().slice(0, 16));
        } else {
          setDeadline('');
        }
        setSelectedDependencies((initialTask.dependencies || []).map((d) => d.id));
      } else {
        resetForm();
      }
    }
  }, [isOpen, initialTask, defaultProjectId]);

  const loadContextData = async () => {
    try {
      setLoading(true);
      const [projRes, tasksRes] = await Promise.all([api.getProjects(), api.getTasks()]);
      setProjects(projRes.projects);
      setAllTasks(tasksRes.tasks);

      if (!initialTask && projRes.projects.length > 0) {
        setProjectId(defaultProjectId || projRes.projects[0].id);
      }
    } catch (err: any) {
      setError('Failed to load projects: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('TODO');
    setCategory('Feature');
    setImportance('MEDIUM');
    setDeadline('');
    setEstimatedEffort(60);
    setSelectedDependencies([]);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) {
      setError('Title and Project are required');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        project_id: projectId,
        title: title.trim(),
        description: description.trim(),
        status,
        category,
        importance,
        estimated_effort: Number(estimatedEffort),
        deadline: deadline ? new Date(deadline).toISOString() : null,
        depends_on_ids: selectedDependencies,
      };

      if (initialTask) {
        await api.updateTask(initialTask.id, payload);
      } else {
        await api.createTask(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDependency = (taskId: string) => {
    if (selectedDependencies.includes(taskId)) {
      setSelectedDependencies(selectedDependencies.filter((id) => id !== taskId));
    } else {
      setSelectedDependencies([...selectedDependencies, taskId]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTask ? 'Edit Deliverable' : 'Create New Task'}
      subtitle="Define task parameters for deterministic scoring & AI priority ranking."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onDismiss={() => setError(null)} />}

        {/* Title */}
        <Input
          label="Task Title *"
          placeholder="e.g. Implement OAuth2 client credentials grant"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Project & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Project Workspace *"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
            required
          />

          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { value: 'Feature', label: 'Feature' },
              { value: 'Security', label: 'Security' },
              { value: 'Infrastructure', label: 'Infrastructure' },
              { value: 'Bug', label: 'Bug' },
              { value: 'Refactor', label: 'Refactor' },
              { value: 'Documentation', label: 'Documentation' },
            ]}
          />
        </div>

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Detail scope, acceptance criteria, technical requirements..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        {/* Status, Importance, Effort */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            options={[
              { value: 'TODO', label: 'TODO' },
              { value: 'IN_PROGRESS', label: 'IN PROGRESS' },
              { value: 'BLOCKED', label: 'BLOCKED' },
              { value: 'COMPLETED', label: 'COMPLETED' },
            ]}
          />

          <Select
            label="Importance"
            value={importance}
            onChange={(e) => setImportance(e.target.value as TaskImportance)}
            options={[
              { value: 'CRITICAL', label: 'CRITICAL (Highest)' },
              { value: 'HIGH', label: 'HIGH' },
              { value: 'MEDIUM', label: 'MEDIUM' },
              { value: 'LOW', label: 'LOW' },
            ]}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Effort (Minutes)
            </label>
            <input
              type="number"
              min="15"
              step="15"
              className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
              value={estimatedEffort}
              onChange={(e) => setEstimatedEffort(parseInt(e.target.value, 10) || 60)}
            />
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Deadline (Target Date & Time)
          </label>
          <input
            type="datetime-local"
            className="w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>

        {/* Initial Dependencies Selector */}
        {!initialTask && (
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Prerequisites (Dependencies this task must wait for)
            </label>
            <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-lg border border-slate-200">
              {allTasks.filter((t) => t.status !== 'COMPLETED').length === 0 ? (
                <p className="text-xs text-slate-400 italic p-1">No other active tasks to depend on.</p>
              ) : (
                allTasks
                  .filter((t) => t.status !== 'COMPLETED')
                  .map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-emerald-50/50 cursor-pointer text-xs text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDependencies.includes(t.id)}
                        onChange={() => toggleDependency(t.id)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="truncate">{t.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono ml-auto">[{t.importance}]</span>
                    </label>
                  ))
              )}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {initialTask ? 'Save Changes' : 'Create & Prioritize'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
