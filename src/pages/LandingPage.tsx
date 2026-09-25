import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Cpu,
  Database,
  GitBranch,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { user, demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoAccess = async () => {
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 flex items-center gap-2">
              PWOA
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                v1.0
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
                Open Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Sign In
                </Button>
                <Button variant="primary" size="sm" onClick={handleDemoAccess}>
                  Try 1-Click Demo
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24 border-b border-slate-100 bg-gradient-to-b from-emerald-50/70 via-emerald-50/20 to-white">
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-emerald-200 text-emerald-800 text-xs font-mono font-medium shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Deterministic Scoring + Gemini 3.8 Flash Hybrid Engine</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            AI Work Management &amp; <br />
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent">
              Intelligent Task Prioritization
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Stop guessing what to work on next. PWOA combines multi-signal deterministic scoring
            (deadlines, dependency graphs, effort, importance) with LLM context reasoning to produce
            actionable, transparent prioritization.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              variant="primary"
              onClick={handleDemoAccess}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Launch Live Workspace (Demo)
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/register')}
            >
              Create Account
            </Button>
          </div>

          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              PostgreSQL Relational DB
            </span>
            <span className="flex items-center gap-1.5">
              <GitBranch className="w-4 h-4 text-emerald-600" />
              Cycle-Validated DAG Dependencies
            </span>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Automated AI Evaluation Benchmark
            </span>
          </div>
        </div>
      </section>

      {/* Core Engineering Features */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-700 font-mono mb-2">
            Engineering Architecture
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Built for enterprise-grade task orchestration
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/5 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Deterministic Priority Engine</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unlike simplistic "ask AI" approaches, PWOA runs transparent weighted math across
              deadline urgency, business criticality, dependency bottlenecks, and effort efficiency.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/5 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center">
              <GitBranch className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Dependency Graph &amp; Cycle Guard</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full Directed Acyclic Graph (DAG) validation. Graph traversal algorithms prevent self-dependencies
              and circular deadlocks before tasks are committed.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-500/5 transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900">Grounded AI Work Assistant</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Powered by server-side Gemini 3.8 Flash. Answers questions like "What can I finish in
              2 hours?" using your live task deadlines, blocked items, and effort estimates.
            </p>
          </div>
        </div>
      </section>

      {/* Evaluation Suite callout */}
      <section className="py-12 border-t border-slate-100 bg-emerald-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 text-xs font-mono font-bold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>MEASURED PORTFOLIO QUALITY</span>
            </div>
            <h4 className="text-lg font-bold text-slate-900">Built-in Automated AI Evaluation Suite</h4>
            <p className="text-xs text-slate-600 max-w-xl mt-1">
              Run real benchmark test cases against the engine. Measures schema compliance, classification accuracy,
              deadline risk detection, and response latency without invented metrics.
            </p>
          </div>

          <Button variant="secondary" size="md" onClick={handleDemoAccess}>
            View Evaluation Suite
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-100 py-8 text-center text-xs text-slate-500">
        <p>PWOA — AI Work Management &amp; Task Prioritization Platform. Production Portfolio Project.</p>
      </footer>
    </div>
  );
};
