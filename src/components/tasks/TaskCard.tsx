import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitBranch,
  Layers,
  MoreVertical,
  RotateCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { api } from '../../api/client';
import { Task } from '../../types';
import { PriorityBadge, RiskBadge, StatusBadge } from '../common/Badge';
import { PriorityBreakdownModal } from './PriorityBreakdownModal';

interface TaskCardProps {
  task: Task;
  onUpdated: () => void;
  onEdit?: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdated, onEdit }) => {
  const navigate = useNavigate();
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const [prioritizing, setPrioritizing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isCompleted = task.status === 'COMPLETED';
  const isOverdue =
    !isCompleted && task.deadline && new Date(task.deadline).getTime() < Date.now();

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const nextStatus = isCompleted ? 'TODO' : 'COMPLETED';
      await api.updateTask(task.id, { status: nextStatus });
      onUpdated();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handlePrioritize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setPrioritizing(true);
      await api.prioritizeTask(task.id);
      onUpdated();
    } catch (err) {
      console.error('Failed to prioritize task:', err);
    } finally {
      setPrioritizing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      await api.deleteTask(task.id);
      onUpdated();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const score = Math.round(task.ai_priority_score || 0);

  return (
    <>
      <div
        onClick={() => navigate(`/tasks/${task.id}`)}
        className={`group relative bg-white border ${
          isOverdue
            ? 'border-rose-300 bg-rose-50/30'
            : isCompleted
            ? 'border-slate-200/60 bg-slate-50/50 opacity-80'
            : 'border-slate-200/90 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/5'
        } rounded-xl p-4 transition-all cursor-pointer flex flex-col justify-between`}
      >
        {/* Top Header: Score & Priority & Menu */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Score pill */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBreakdownOpen(true);
                }}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-xs font-semibold hover:bg-emerald-100 transition-colors"
                title="Click for full AI prioritization signals breakdown"
              >
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>{score}</span>
              </button>

              <PriorityBadge priority={task.ai_priority_label} />

              {isOverdue && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  OVERDUE
                </span>
              )}

              {task.status === 'BLOCKED' && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">
                  BLOCKED
                </span>
              )}
            </div>

            {/* Quick Actions Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-30 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      setMenuOpen(false);
                      handlePrioritize(e);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
                    Rerun AI Priority
                  </button>
                  {onEdit && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit(task);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      Edit Task
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      setMenuOpen(false);
                      handleDelete(e);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-rose-50 flex items-center gap-2 text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Task
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Title & Description */}
          <h4
            className={`font-semibold text-sm mb-1.5 line-clamp-2 ${
              isCompleted ? 'line-through text-slate-400' : 'text-slate-900 group-hover:text-emerald-700'
            }`}
          >
            {task.title}
          </h4>

          {task.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* AI Reasoning preview snippet */}
          {task.ai_recommended_action && !isCompleted && (
            <div className="mb-3 px-2.5 py-1.5 rounded-md bg-emerald-50/60 border border-emerald-100 text-[11px] text-emerald-900 flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">{task.ai_recommended_action}</span>
            </div>
          )}
        </div>

        {/* Card Footer: Metadata badges & Action check */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            {/* Completion checkbox button */}
            <button
              onClick={handleToggleComplete}
              className={`p-1 rounded-md transition-colors ${
                isCompleted
                  ? 'text-emerald-600 hover:text-emerald-700'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
            >
              <CheckCircle2 className={`w-4 h-4 ${isCompleted ? 'fill-emerald-100' : ''}`} />
            </button>

            {/* Category tag */}
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
              {task.category}
            </span>

            {/* Dependencies count */}
            {((task.dependencies && task.dependencies.length > 0) ||
              (task.blocked_tasks && task.blocked_tasks.length > 0)) && (
              <span
                className="flex items-center gap-1 text-[11px] text-slate-500 font-mono"
                title={`${task.dependencies?.length || 0} prerequisites, ${task.blocked_tasks?.length || 0} downstream blocked`}
              >
                <GitBranch className="w-3 h-3 text-emerald-600" />
                <span>
                  {task.dependencies?.length || 0} / {task.blocked_tasks?.length || 0}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Estimated Effort */}
            <span className="flex items-center gap-1 text-[11px] text-slate-500">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>{task.estimated_effort >= 60 ? `${(task.estimated_effort / 60).toFixed(1)}h` : `${task.estimated_effort}m`}</span>
            </span>

            {/* Deadline */}
            {task.deadline && (
              <span
                className={`flex items-center gap-1 text-[11px] ${
                  isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'
                }`}
              >
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <PriorityBreakdownModal
        task={task}
        isOpen={isBreakdownOpen}
        onClose={() => setIsBreakdownOpen(false)}
      />
    </>
  );
};
