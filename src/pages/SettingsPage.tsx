import React, { useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Database,
  RefreshCw,
  Save,
  Sliders,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user, updateWeights } = useAuth();

  const [weights, setWeights] = useState({
    deadline: user?.priority_weights?.deadline ?? 0.35,
    importance: user?.priority_weights?.importance ?? 0.25,
    dependency: user?.priority_weights?.dependency ?? 0.20,
    effort: user?.priority_weights?.effort ?? 0.10,
    project: user?.priority_weights?.project ?? 0.10,
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalRaw =
    weights.deadline + weights.importance + weights.dependency + weights.effort + weights.project;

  const handleSliderChange = (key: keyof typeof weights, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveWeights = async () => {
    try {
      setSaving(true);
      await updateWeights(weights);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setWeights({
      deadline: 0.35,
      importance: 0.25,
      dependency: 0.20,
      effort: 0.10,
      project: 0.10,
    });
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Engine Settings &amp; Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tune the multi-signal mathematical weights governing the deterministic priority algorithm.
        </p>
      </div>

      {/* Priority Engine Weights Configuration */}
      <Card>
        <CardHeader
          title="Deterministic Priority Weights"
          subtitle="Adjust the relative importance of factors before LLM contextual synthesis"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetDefaults}
              className="text-xs"
            >
              Reset to Defaults
            </Button>
          }
        />

        <div className="space-y-6 pt-2">
          {/* Deadline Urgency */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">
                Deadline Urgency Weight: {Math.round(weights.deadline * 100)}%
              </span>
              <span className="text-slate-500 font-mono">w = {weights.deadline.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.deadline}
              onChange={(e) => handleSliderChange('deadline', parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Penalizes overdue items and escalates deliverables due within 24–72 hours.
            </p>
          </div>

          {/* Task Importance */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">
                Task Business Criticality Weight: {Math.round(weights.importance * 100)}%
              </span>
              <span className="text-slate-500 font-mono">w = {weights.importance.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.importance}
              onChange={(e) => handleSliderChange('importance', parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Evaluates user-designated importance (CRITICAL=100, HIGH=75, MEDIUM=50, LOW=25).
            </p>
          </div>

          {/* Dependency Impact */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">
                Dependency Critical Path Weight: {Math.round(weights.dependency * 100)}%
              </span>
              <span className="text-slate-500 font-mono">w = {weights.dependency.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.dependency}
              onChange={(e) => handleSliderChange('dependency', parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Escalates hub tasks that block multiple downstream deliverables.
            </p>
          </div>

          {/* Effort Efficiency */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">
                Effort Efficiency (Quick-Win) Weight: {Math.round(weights.effort * 100)}%
              </span>
              <span className="text-slate-500 font-mono">w = {weights.effort.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.effort}
              onChange={(e) => handleSliderChange('effort', parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Awards higher efficiency scores to tasks achievable in ≤60–120 minutes.
            </p>
          </div>

          {/* Project Criticality */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">
                Project Strategic Importance: {Math.round(weights.project * 100)}%
              </span>
              <span className="text-slate-500 font-mono">w = {weights.project.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.project}
              onChange={(e) => handleSliderChange('project', parseFloat(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <p className="text-[11px] text-slate-500">
              Inherits importance from the parent project workspace.
            </p>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Weights automatically normalize to 100% on execution.
            </span>
            <div className="flex items-center gap-3">
              {success && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Saved!
                </span>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveWeights}
                loading={saving}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Save Weights
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Account & Profile */}
      <Card>
        <CardHeader title="Account Profile" subtitle="Authenticated session details" />
        <div className="space-y-3 pt-2 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Full Name</span>
            <span className="text-slate-800 font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Email Address</span>
            <span className="text-slate-800 font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">User Identifier</span>
            <span className="text-slate-400 font-mono text-[11px]">{user?.id}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Database Engine</span>
            <span className="text-emerald-700 font-mono text-[11px] font-semibold flex items-center gap-1">
              <Database className="w-3 h-3 text-emerald-600" />
              PostgreSQL Relational Storage
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
