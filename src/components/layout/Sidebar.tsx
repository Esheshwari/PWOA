import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Bot,
  CheckSquare,
  Cpu,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Tasks & Board', href: '/tasks', icon: CheckSquare },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'AI Work Assistant', href: '/ai-assistant', icon: Bot, badge: 'Gemini' },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'AI Benchmark / Eval', href: '/evaluations', icon: Cpu, badge: 'Suite' },
    { name: 'Settings & Weights', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200/90 transition-transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between shadow-xs`}
      >
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                PWOA
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  AI CORE
                </span>
              </span>
              <p className="text-[11px] text-slate-500">Work &amp; Task Priority</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Workspace
            </div>
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/90 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-medium">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Engine status footer */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
            <div className="flex items-center gap-2 mb-1.5 text-slate-800 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Priority Engine</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Deterministic scoring blended with Gemini 3.8 Flash analysis.
            </p>
            <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-emerald-100 pt-2">
              <span>Relational PostgreSQL</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
