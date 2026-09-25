import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Cpu,
  FileCode,
  Play,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api } from '../../src/api/client';
import { EvaluationResult } from '../../src/types';
import { Button } from '../components/common/Button';
import { Card, CardHeader } from '../components/common/Card';
import { CardSkeleton } from '../components/common/Skeleton';

export const EvaluationsPage: React.FC = () => {
  const [latestEval, setLatestEval] = useState<EvaluationResult | null>(null);
  const [benchmarkCases, setBenchmarkCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  useEffect(() => {
    loadEvalHistory();
  }, []);

  const loadEvalHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getLatestEvaluation();
      setLatestEval(res.latest);
      setBenchmarkCases(res.benchmark_cases);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunEvaluation = async () => {
    try {
      setRunning(true);
      const res = await api.runEvaluation();
      setLatestEval(res.evaluation);
    } catch (err) {
      console.error('Evaluation run failed:', err);
    } finally {
      setRunning(false);
    }
  };

  if (loading && !latestEval) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            AI Automated Evaluation Suite
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              Benchmark Runner
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Empirical quality benchmarks measuring schema compliance, classification accuracy, risk detection &amp; latency.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleRunEvaluation}
          loading={running}
          icon={<Play className="w-3.5 h-3.5 fill-current" />}
          className="text-xs"
        >
          {running ? 'Executing Test Suite...' : 'Run Live Benchmark'}
        </Button>
      </div>

      {/* Measured Benchmark Scores */}
      {latestEval ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Schema Compliance</span>
              <FileCode className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600">
              {latestEval.schema_compliance_rate}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Structured JSON schema valid</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Priority Accuracy</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-700">
              {latestEval.priority_accuracy}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Aligned with ground truth rank</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Deadline Risk F1</span>
              <AlertCircle className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold font-mono text-teal-700">
              {latestEval.deadline_risk_f1}%
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Urgency &amp; overdue detection</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Average Latency</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-600">
              {latestEval.avg_latency_ms} ms
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Per-task evaluation time</p>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
          <Cpu className="w-10 h-10 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No evaluation run recorded yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click "Run Live Benchmark" to execute the test suite against the live priority engine.
          </p>
          <Button size="sm" variant="primary" onClick={handleRunEvaluation} loading={running}>
            Start Evaluation
          </Button>
        </div>
      )}

      {/* Test Cases Table */}
      {latestEval && (
        <Card>
          <CardHeader
            title="Benchmark Test Cases Results"
            subtitle={`Run at: ${new Date(latestEval.test_run_at).toLocaleString()} (${latestEval.passed_cases}/${latestEval.total_cases} passed)`}
          />

          <div className="space-y-3">
            {latestEval.test_results.map((res) => {
              const isExpanded = expandedCaseId === res.case_id;
              return (
                <div
                  key={res.case_id}
                  className="rounded-xl bg-white border border-slate-200 overflow-hidden shadow-2xs"
                >
                  <div
                    onClick={() => setExpandedCaseId(isExpanded ? null : res.case_id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {res.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{res.case_name}</h4>
                        <p className="text-xs text-slate-400 font-mono">{res.case_id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-slate-500">
                        Priority: <strong className="text-slate-900">{res.output.priority_label}</strong>
                      </span>
                      <span className="text-slate-500">
                        Risk: <strong className="text-slate-900">{res.output.deadline_risk}</strong>
                      </span>
                      <span className="text-slate-400">{res.latency_ms}ms</span>
                      <span className="text-emerald-700 font-semibold text-xs">{isExpanded ? 'Hide' : 'Inspect'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 border-t border-slate-100 bg-slate-50/70 text-xs space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-semibold text-slate-800 mb-1">AI Reasoning Output:</p>
                          <p className="text-slate-600 italic">"{res.output.reasoning}"</p>
                          <p className="mt-2 text-slate-800">
                            <strong>Recommended Action:</strong> {res.output.recommended_action}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800 mb-1">Key Factors Identified:</p>
                          <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                            {res.output.key_factors?.map((k: string, i: number) => (
                              <li key={i}>{k}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>Schema Valid: {res.schema_valid ? 'YES' : 'NO'}</span>
                        <span>Priority Matched: {res.priority_matched ? 'YES' : 'NO'}</span>
                        <span>Risk Matched: {res.risk_matched ? 'YES' : 'NO'}</span>
                        <span>Dependency Aware: {res.dependency_detected ? 'YES' : 'NO'}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
