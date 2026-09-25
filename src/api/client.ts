import { DashboardMetrics, EvaluationResult, PriorityWeights, Project, Task } from '../types';

const TOKEN_KEY = 'pwoa_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP ${response.status}: Request failed`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (name: string, email: string, password: string) =>
    request<{ user: any; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
  login: (email: string, password: string) =>
    request<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request<{ user: any }>('/api/auth/me'),
  updateWeights: (weights: Partial<PriorityWeights>) =>
    request<{ user: any }>('/api/auth/weights', {
      method: 'PUT',
      body: JSON.stringify({ weights }),
    }),

  // Projects
  getProjects: () => request<{ projects: Project[] }>('/api/projects'),
  getProject: (id: string) => request<{ project: Project }>(`/api/projects/${id}`),
  createProject: (data: { name: string; description?: string; importance?: string; color?: string }) =>
    request<{ project: Project }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProject: (id: string, data: Partial<Project>) =>
    request<{ project: Project }>(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProject: (id: string) =>
    request<{ success: boolean }>(`/api/projects/${id}`, {
      method: 'DELETE',
    }),

  // Tasks
  getTasks: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ tasks: Task[] }>(`/api/tasks${query ? `?${query}` : ''}`);
  },
  getTask: (id: string) => request<{ task: Task }>(`/api/tasks/${id}`),
  createTask: (data: any) =>
    request<{ task: Task }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (id: string, data: any) =>
    request<{ task: Task }>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTask: (id: string) =>
    request<{ success: boolean }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    }),
  prioritizeTask: (id: string) =>
    request<{ task: Task }>(`/api/tasks/${id}/prioritize`, {
      method: 'POST',
    }),
  prioritizeAll: (projectId?: string) =>
    request<{ success: boolean; prioritized_count: number }>('/api/tasks/prioritize-all', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    }),

  // Dependencies
  addDependency: (taskId: string, dependsOnTaskId: string) =>
    request<{ task: Task }>(`/api/tasks/${taskId}/dependencies`, {
      method: 'POST',
      body: JSON.stringify({ depends_on_task_id: dependsOnTaskId }),
    }),
  removeDependency: (taskId: string, dependsOnTaskId: string) =>
    request<{ task: Task }>(`/api/tasks/${taskId}/dependencies/${dependsOnTaskId}`, {
      method: 'DELETE',
    }),

  // AI Assistant
  askAI: (prompt: string) =>
    request<{ answer: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  // Analytics
  getAnalytics: () => request<{ analytics: DashboardMetrics }>('/api/analytics'),

  // Evaluation
  getLatestEvaluation: () =>
    request<{ latest: EvaluationResult | null; benchmark_cases: any[] }>('/api/evaluations/latest'),
  runEvaluation: () =>
    request<{ evaluation: EvaluationResult }>('/api/evaluations/run', {
      method: 'POST',
    }),
};
