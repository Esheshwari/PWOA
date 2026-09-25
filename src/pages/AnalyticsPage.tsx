import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  GitBranch,
  Layers,
  PieChart,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { api } from '../../src/api/client';
import { DashboardMetrics } from '../../src/types';
import { Card, CardHeader } from '../components/common/Card';
import { CardSkeleton } from '../components/common/Skeleton';

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics();
      setMetrics(res.analytics);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const s = metrics.summary;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          Productivity &amp; Velocity Analytics
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            Relational Telemetry
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time metrics computed directly from PostgreSQL task status, cycle time, and dependency graphs.
        </p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-xs text-slate-500 mb-1">Completion Rate</p>
          <div className="text-2xl font-bold font-mono text-emerald-600">
            {s.completion_rate_percentage}%
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {s.completed_tasks} of {s.total_tasks} finished
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-xs text-slate-500 mb-1">Avg Priority Score</p>
          <div className="text-2xl font-bold font-mono text-emerald-700">
            {s.avg_priority_score} / 100
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Weighted composite priority</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-xs text-slate-500 mb-1">Due in 48 Hours</p>
          <div className="text-2xl font-bold font-mono text-amber-600">{s.due_soon_tasks}</div>
          <p className="text-[11px] text-slate-400 mt-1">Active urgent deliverables</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <p className="text-xs text-slate-500 mb-1">Overdue Items</p>
          <div
            className={`text-2xl font-bold font-mono ${
              s.overdue_tasks > 0 ? 'text-rose-600' : 'text-slate-400'
            }`}
          >
            {s.overdue_tasks}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Missed target dates</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card>
          <CardHeader
            title="Task Volume by Status"
            subtitle="Current active workstream distribution"
          />
          <div className="space-y-4 pt-2">
            {metrics.by_status.map((item) => (
              <div key={item.status} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800">{item.status}</span>
                  <span className="font-mono text-slate-500">
                    {item.count} tasks ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
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

        {/* Priority Breakdown */}
        <Card>
          <CardHeader
            title="Priority Distribution"
            subtitle="AI classification breakdown across all work"
          />
          <div className="space-y-4 pt-2">
            {metrics.by_priority.map((item) => {
              const colors: Record<string, string> = {
                CRITICAL: 'bg-rose-500',
                HIGH: 'bg-amber-500',
                MEDIUM: 'bg-emerald-600',
                LOW: 'bg-slate-400',
              };
              return (
                <div key={item.priority} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.priority}</span>
                    <span className="font-mono text-slate-500">
                      {item.count} tasks ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full ${colors[item.priority] || 'bg-emerald-500'}`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Work Category Breakdown */}
        <Card>
          <CardHeader
            title="Workstreams by Category"
            subtitle="Effort allocation across functional domains"
          />
          <div className="space-y-3 pt-2">
            {metrics.by_category.map((item) => {
              const pct = s.total_tasks > 0 ? Math.round((item.count / s.total_tasks) * 100) : 0;
              return (
                <div key={item.category} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.category}</span>
                    <span className="font-mono text-slate-500">
                      {item.count} tasks ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Bottleneck Critical Path Analysis */}
        <Card>
          <CardHeader
            title="Bottleneck Deliverables"
            subtitle="Uncompleted tasks with the highest downstream block count"
          />
          <div className="space-y-2.5 pt-2">
            {metrics.bottlenecks.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">
                No active bottlenecks. All dependency prerequisites are cleared!
              </p>
            ) : (
              metrics.bottlenecks.map((b) => (
                <div
                  key={b.task_id}
                  onClick={() => navigate(`/tasks/${b.task_id}`)}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-amber-400 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono font-semibold text-amber-600 flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5" />
                      Blocks {b.blocks_count} other tasks
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
                      {b.importance}
                    </span>
                  </div>
                  <p className="text-xs text-slate-900 font-semibold truncate">{b.title}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
