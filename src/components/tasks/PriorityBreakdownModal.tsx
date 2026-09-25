import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Cpu,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Task } from '../../types';
import { PriorityBadge, RiskBadge, StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface PriorityBreakdownModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PriorityBreakdownModal: React.FC<PriorityBreakdownModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  if (!task) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Priority Engine Analysis"
      subtitle={`Deterministic signals & Gemini AI synthesis for: ${task.title}`}
      maxWidth="xl"
    >
      <div className="space-y-5 text-sm">
        {/* Top Summary Banner */}
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex flex-col items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <span className="text-lg font-bold leading-none font-mono">
                {Math.round(task.ai_priority_score || 0)}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-emerald-100 font-semibold">Score</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <PriorityBadge priority={task.ai_priority_label} />
                <RiskBadge risk={task.ai_deadline_risk} />
                <StatusBadge status={task.status} />
              </div>
              <p className="text-xs text-slate-500">
                Project:{' '}
                <span className="text-slate-900 font-semibold">
                  {task.project_name || 'General Workspace'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* AI Explanation & Recommendation */}
        <div className="p-4 rounded-xl bg-white border border-emerald-100 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs tracking-wide uppercase">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>AI Reasoning & Recommendation</span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed italic">
            "{task.ai_explanation || 'Priority derived from multi-signal deterministic engine.'}"
          </p>

          {task.ai_recommended_action && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-950 font-bold">Action: </strong>
                {task.ai_recommended_action}
              </div>
            </div>
          )}

          {task.ai_key_factors && task.ai_key_factors.length > 0 && (
            <div>
              <h5 className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Key Decision Factors:
              </h5>
              <ul className="space-y-1">
                {task.ai_key_factors.map((factor, idx) => (
                  <li key={idx} className="text-xs text-slate-700 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Deterministic Signal Attributes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
              <Clock className="w-3.5 h-3.5 text-sky-600" />
              <span>Deadline</span>
            </div>
            <p className="text-xs font-semibold text-slate-800">
              {task.deadline
                ? new Date(task.deadline).toLocaleDateString()
                : 'No deadline set'}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Importance</span>
            </div>
            <p className="text-xs font-semibold text-slate-800">{task.importance}</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Effort</span>
            </div>
            <p className="text-xs font-semibold text-slate-800">
              {task.estimated_effort} mins (~{(task.estimated_effort / 60).toFixed(1)}h)
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mb-1">
              <Cpu className="w-3.5 h-3.5 text-rose-600" />
              <span>Dependencies</span>
            </div>
            <p className="text-xs font-semibold text-slate-800">
              {task.dependencies?.length || 0} upstream / {task.blocked_tasks?.length || 0} downstream
            </p>
          </div>
        </div>

        {/* Formula Transparency Note */}
        <div className="p-3 rounded-lg bg-emerald-50/40 border border-emerald-100 text-[11px] text-slate-600 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            PWOA combines multi-factor deterministic scoring (35% deadline urgency + 25% task
            importance + 20% dependency impact + 10% effort efficiency + 10% project importance)
            with Gemini LLM context synthesis.
          </span>
        </div>
      </div>
    </Modal>
  );
};
