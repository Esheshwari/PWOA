export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';
export type TaskImportance = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PriorityLabel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DeadlineRisk = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PriorityWeights {
  deadline: number;
  importance: number;
  dependency: number;
  effort: number;
  project: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  priority_weights: PriorityWeights;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string;
  importance: TaskImportance;
  color: string;
  created_at: string;
  updated_at: string;
  task_count?: number;
  completed_task_count?: number;
  blocked_task_count?: number;
  progress_percentage?: number;
}

export interface TaskDependency {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface Task {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  category: string;
  deadline: string | null;
  importance: TaskImportance;
  estimated_effort: number; // in minutes
  manually_assigned_priority: string;
  ai_priority_score: number;
  ai_priority_label: PriorityLabel;
  ai_explanation: string;
  ai_deadline_risk: DeadlineRisk;
  ai_recommended_action: string;
  ai_key_factors: string[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  project_name?: string;
  project_importance?: TaskImportance;
  project_color?: string;
  dependencies?: TaskDependency[];
  blocked_tasks?: TaskDependency[];
}

export interface DashboardMetrics {
  summary: {
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    blocked_tasks: number;
    overdue_tasks: number;
    due_soon_tasks: number;
    critical_priority_tasks: number;
    high_priority_tasks: number;
    total_projects: number;
    completion_rate_percentage: number;
    avg_priority_score: number;
  };
  by_status: { status: string; count: number; percentage: number }[];
  by_priority: { priority: string; count: number; percentage: number }[];
  by_category: { category: string; count: number }[];
  by_deadline_risk: { risk: string; count: number }[];
  bottlenecks: {
    task_id: string;
    title: string;
    status: string;
    blocks_count: number;
    importance: string;
  }[];
  recent_activity: {
    id: string;
    title: string;
    status: string;
    ai_priority_score: number;
    updated_at: string;
  }[];
}

export interface EvaluationResult {
  id: string;
  test_run_at: string;
  total_cases: number;
  passed_cases: number;
  schema_compliance_rate: number;
  priority_accuracy: number;
  deadline_risk_f1: number;
  avg_latency_ms: number;
  test_results: {
    case_id: string;
    case_name: string;
    passed: boolean;
    latency_ms: number;
    schema_valid: boolean;
    priority_matched: boolean;
    risk_matched: boolean;
    dependency_detected: boolean;
    output: any;
    expected: any;
  }[];
}
