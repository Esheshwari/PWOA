import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronDown,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Sparkles,
  User,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenNewTaskModal?: () => void;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onOpenNewTaskModal,
  onRefreshData,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [prioritizing, setPrioritizing] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handlePrioritizeAll = async () => {
    try {
      setPrioritizing(true);
      const res = await api.prioritizeAll();
      setSuccessToast(`Prioritized ${res.prioritized_count} tasks with AI Engine!`);
      setTimeout(() => setSuccessToast(null), 3500);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error('Prioritize all error:', err);
    } finally {
      setPrioritizing(false);
    }
  };

  return (
    <header className="h-16 bg-white/95 border-b border-slate-200/80 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-emerald-800">PWOA AI PLATFORM</span>
        </div>
      </div>

      {successToast && (
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-fadeIn shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Prioritize All Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrioritizeAll}
          loading={prioritizing}
          icon={<RefreshCw className={`w-3.5 h-3.5 ${prioritizing ? 'animate-spin' : ''}`} />}
          className="hidden sm:inline-flex text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          title="Run deterministic scoring & AI synthesis across all tasks"
        >
          Prioritize All
        </Button>

        {/* Quick Add Task */}
        {onOpenNewTaskModal && (
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenNewTaskModal}
            icon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            New Task
          </Button>
        )}

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xs font-semibold text-emerald-800">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 leading-none">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 leading-none mt-1 truncate max-w-[120px]">
                {user?.email}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {userDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 text-slate-700 animate-fadeIn"
              onClick={() => setUserDropdownOpen(false)}
            >
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>

              <button
                onClick={() => navigate('/settings')}
                className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                Settings & Engine Weights
              </button>

              <button
                onClick={() => navigate('/evaluations')}
                className="w-full text-left px-3.5 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                AI Benchmark Suite
              </button>

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={logout}
                className="w-full text-left px-3.5 py-2 text-xs hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
