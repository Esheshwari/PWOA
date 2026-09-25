import React, { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  ArrowUpDown,
  Filter,
  Grid3X3,
  Kanban,
  List,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { api } from '../../src/api/client';
import { Project, Task, TaskImportance, TaskStatus } from '../../src/types';
import { Button } from '../components/common/Button';
import { Input, Select } from '../components/common/Input';
import { CardSkeleton } from '../components/common/Skeleton';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskModal } from '../components/tasks/TaskModal';

export const TasksPage: React.FC = () => {
  const context = useOutletContext<{ refreshKey?: number; triggerRefresh?: () => void }>();
  const [searchParams] = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [prioritizingAll, setPrioritizingAll] = useState(false);

  // Filters & Views
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'matrix'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState(searchParams.get('project') || '');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('priority');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
  }, [
    selectedProject,
    selectedStatus,
    selectedPriority,
    selectedCategory,
    sortBy,
    context?.refreshKey,
  ]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { sortBy };
      if (selectedProject) params.projectId = selectedProject;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedPriority) params.importance = selectedPriority;
      if (selectedCategory) params.category = selectedCategory;

      const [taskRes, projRes] = await Promise.all([api.getTasks(params), api.getProjects()]);
      setTasks(taskRes.tasks);
      setProjects(projRes.projects);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrioritizeAll = async () => {
    try {
      setPrioritizingAll(true);
      await api.prioritizeAll(selectedProject || undefined);
      await loadTasks();
      if (context?.triggerRefresh) context.triggerRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setPrioritizingAll(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q));
  });

  // Kanban Columns
  const kanbanColumns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'TODO', label: 'To Do', color: 'border-slate-700' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-sky-500/40' },
    { id: 'BLOCKED', label: 'Blocked (Dependency Wait)', color: 'border-amber-500/40' },
    { id: 'COMPLETED', label: 'Completed', color: 'border-emerald-500/40' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            Task Orchestration
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              {filteredTasks.length} items
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage deliverables, assign dependencies, and evaluate AI priority rankings.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* View Mode Toggle Buttons */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'list'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Prioritized List View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden md:inline">List</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Eisenhower Priority Matrix"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Matrix</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrioritizeAll}
            loading={prioritizingAll}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${prioritizingAll ? 'animate-spin' : ''}`} />}
            className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
          >
            Re-Prioritize
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            icon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 shadow-2xs">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tasks, descriptions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Project Selector */}
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Status Selector */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="BLOCKED">Blocked</option>
          <option value="COMPLETED">Completed</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="priority">Sort: AI Priority Score</option>
          <option value="deadline">Sort: Deadline</option>
          <option value="importance">Sort: Importance</option>
          <option value="effort">Sort: Estimated Effort</option>
          <option value="created">Sort: Created Date</option>
        </select>
      </div>

      {/* Main Task Views */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white shadow-2xs">
          <p className="text-sm font-semibold text-slate-700">No tasks match your filters</p>
          <p className="text-xs text-slate-400 mt-1">Adjust search query or create a new deliverable.</p>
          <Button
            size="sm"
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setSearchQuery('');
              setSelectedProject('');
              setSelectedStatus('');
              setSelectedPriority('');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-3 sm:p-4 flex flex-col min-h-[500px]"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-800">{col.label}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 font-semibold shadow-2xs">
                      {colTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingTask(null);
                      setIsModalOpen(true);
                    }}
                    className="text-slate-400 hover:text-slate-700 p-1"
                    title={`Add task to ${col.label}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdated={loadTasks}
                      onEdit={(t) => {
                        setEditingTask(t);
                        setIsModalOpen(true);
                      }}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400 italic">No tasks</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'list' ? (
        /* Prioritized List View */
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdated={loadTasks}
              onEdit={(t) => {
                setEditingTask(t);
                setIsModalOpen(true);
              }}
            />
          ))}
        </div>
      ) : (
        /* Priority Matrix View (Urgent & Important) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quadrant 1: Urgent & Critical/High (Do First) */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-rose-200 pb-2">
              <span className="font-bold text-xs text-rose-800 uppercase tracking-wider">
                Q1: Do First (Critical / Urgent Deadlines)
              </span>
              <span className="text-xs font-mono font-bold text-rose-700">
                {
                  filteredTasks.filter(
                    (t) =>
                      t.status !== 'COMPLETED' &&
                      (t.ai_priority_label === 'CRITICAL' || t.ai_deadline_risk === 'CRITICAL')
                  ).length
                }
              </span>
            </div>
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {filteredTasks
                .filter(
                  (t) =>
                    t.status !== 'COMPLETED' &&
                    (t.ai_priority_label === 'CRITICAL' || t.ai_deadline_risk === 'CRITICAL')
                )
                .map((task) => (
                  <TaskCard key={task.id} task={task} onUpdated={loadTasks} />
                ))}
            </div>
          </div>

          {/* Quadrant 2: High Importance, Not Overdue (Schedule) */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <span className="font-bold text-xs text-emerald-800 uppercase tracking-wider">
                Q2: Schedule (High Impact Strategic)
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700">
                {
                  filteredTasks.filter(
                    (t) =>
                      t.status !== 'COMPLETED' &&
                      t.ai_priority_label === 'HIGH' &&
                      t.ai_deadline_risk !== 'CRITICAL'
                  ).length
                }
              </span>
            </div>
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {filteredTasks
                .filter(
                  (t) =>
                    t.status !== 'COMPLETED' &&
                    t.ai_priority_label === 'HIGH' &&
                    t.ai_deadline_risk !== 'CRITICAL'
                )
                .map((task) => (
                  <TaskCard key={task.id} task={task} onUpdated={loadTasks} />
                ))}
            </div>
          </div>

          {/* Quadrant 3: Quick Wins & Medium Priority */}
          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-teal-200 pb-2">
              <span className="font-bold text-xs text-teal-800 uppercase tracking-wider">
                Q3: Quick Wins (Medium Priority / Rapid Turnaround)
              </span>
              <span className="text-xs font-mono font-bold text-teal-700">
                {
                  filteredTasks.filter(
                    (t) => t.status !== 'COMPLETED' && t.ai_priority_label === 'MEDIUM'
                  ).length
                }
              </span>
            </div>
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {filteredTasks
                .filter((t) => t.status !== 'COMPLETED' && t.ai_priority_label === 'MEDIUM')
                .map((task) => (
                  <TaskCard key={task.id} task={task} onUpdated={loadTasks} />
                ))}
            </div>
          </div>

          {/* Quadrant 4: Backlog / Low Priority */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Q4: Low Priority / Backlog Queue
              </span>
              <span className="text-xs font-mono font-bold text-slate-600">
                {
                  filteredTasks.filter(
                    (t) => t.status !== 'COMPLETED' && t.ai_priority_label === 'LOW'
                  ).length
                }
              </span>
            </div>
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {filteredTasks
                .filter((t) => t.status !== 'COMPLETED' && t.ai_priority_label === 'LOW')
                .map((task) => (
                  <TaskCard key={task.id} task={task} onUpdated={loadTasks} />
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Task Modal for Create / Edit */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSaved={loadTasks}
        initialTask={editingTask}
        defaultProjectId={selectedProject}
      />
    </div>
  );
};
