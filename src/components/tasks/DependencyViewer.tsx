import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Plus,
  Trash2,
} from 'lucide-react';
import { api } from '../../api/client';
import { Task } from '../../types';
import { StatusBadge } from '../common/Badge';
import { Button } from '../common/Button';

interface DependencyViewerProps {
  task: Task;
  allTasks: Task[];
  onUpdated: () => void;
}

export const DependencyViewer: React.FC<DependencyViewerProps> = ({
  task,
  allTasks,
  onUpdated,
}) => {
  const [selectedDependsOnId, setSelectedDependsOnId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available tasks to add as dependency (exclude self and already existing)
  const existingDepIds = new Set((task.dependencies || []).map((d) => d.id));
  const candidateTasks = allTasks.filter(
    (t) => t.id !== task.id && !existingDepIds.has(t.id) && t.status !== 'COMPLETED'
  );

  const handleAddDependency = async () => {
    if (!selectedDependsOnId) return;
    try {
      setLoading(true);
      setError(null);
      await api.addDependency(task.id, selectedDependsOnId);
      setSelectedDependsOnId('');
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to add dependency');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDependency = async (depId: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.removeDependency(task.id, depId);
      onUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to remove dependency');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
          <span>Dependency Graph</span>
        </h4>
        <span className="text-[11px] text-slate-500 font-mono">
          Cycle-validated DAG
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Upstream Prerequisites (What this task depends on) */}
      <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
            <span>Prerequisites (This task is waiting on)</span>
          </span>
          <span className="text-[11px] text-slate-500">
            {task.dependencies?.length || 0} prerequisite(s)
          </span>
        </div>

        {task.dependencies && task.dependencies.length > 0 ? (
          <div className="space-y-1.5">
            {task.dependencies.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs"
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="font-semibold text-slate-900 truncate">{dep.title}</span>
                  <StatusBadge status={dep.status} />
                </div>
                <button
                  onClick={() => handleRemoveDependency(dep.id)}
                  disabled={loading}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                  title="Remove dependency"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No prerequisites. This task can be worked on immediately.</p>
        )}

        {/* Add prerequisite dropdown */}
        {candidateTasks.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
            <select
              value={selectedDependsOnId}
              onChange={(e) => setSelectedDependsOnId(e.target.value)}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Select a prerequisite task...</option>
              {candidateTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.status})
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAddDependency}
              disabled={!selectedDependsOnId || loading}
              icon={<Plus className="w-3 h-3" />}
              className="text-xs shrink-0"
            >
              Add
            </Button>
          </div>
        )}
      </div>

      {/* Downstream Blocked Tasks (Tasks waiting on THIS task) */}
      <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Downstream Deliverables (Waiting on this task)</span>
          </span>
          <span className="text-[11px] text-slate-500">
            {task.blocked_tasks?.length || 0} dependent(s)
          </span>
        </div>

        {task.blocked_tasks && task.blocked_tasks.length > 0 ? (
          <div className="space-y-1.5">
            {task.blocked_tasks.map((bt) => (
              <div
                key={bt.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 text-xs shadow-2xs"
              >
                <span className="font-semibold text-slate-900 truncate pr-2">{bt.title || bt.id}</span>
                {bt.status ? <StatusBadge status={bt.status} /> : <span className="text-amber-600 font-mono text-[10px] font-bold">BLOCKED</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">No downstream tasks currently blocked by this deliverable.</p>
        )}
      </div>
    </div>
  );
};
