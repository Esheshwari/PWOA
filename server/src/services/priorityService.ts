export interface PriorityWeights {
  deadline: number;
  importance: number;
  dependency: number;
  effort: number;
  project: number;
}

export const DEFAULT_WEIGHTS: PriorityWeights = {
  deadline: 0.35,
  importance: 0.25,
  dependency: 0.20,
  effort: 0.10,
  project: 0.10,
};

export interface TaskEvaluationInput {
  id: string;
  title: string;
  description?: string;
  status: string;
  category: string;
  deadline?: string | Date | null;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  estimated_effort: number; // in minutes
  project_importance?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  project_name?: string;
  blocked_downstream_count?: number; // how many tasks are waiting for this task
  unresolved_dependencies_count?: number; // how many prerequisites this task is waiting on
}

export interface DeterministicPriorityResult {
  deterministic_score: number;
  signals: {
    deadline_urgency: number;
    task_importance: number;
    dependency_impact: number;
    effort_efficiency: number;
    project_importance: number;
    hours_to_deadline: number | null;
    is_overdue: boolean;
    blocks_count: number;
    is_blocked: boolean;
  };
  urgency_level: 'OVERDUE' | 'URGENT' | 'UPCOMING' | 'RELAXED';
  deadline_risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  preliminary_priority_label: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  deterministic_reasoning: string;
  weights_used: PriorityWeights;
}

export function calculateDeterministicPriority(
  task: TaskEvaluationInput,
  userWeights: Partial<PriorityWeights> = {}
): DeterministicPriorityResult {
  const weights: PriorityWeights = {
    ...DEFAULT_WEIGHTS,
    ...userWeights,
  };

  // Normalize weights so they sum to 1.0
  const weightSum =
    (weights.deadline || 0) +
    (weights.importance || 0) +
    (weights.dependency || 0) +
    (weights.effort || 0) +
    (weights.project || 0) || 1.0;

  const wDeadline = (weights.deadline || 0) / weightSum;
  const wImportance = (weights.importance || 0) / weightSum;
  const wDependency = (weights.dependency || 0) / weightSum;
  const wEffort = (weights.effort || 0) / weightSum;
  const wProject = (weights.project || 0) / weightSum;

  if (task.status === 'COMPLETED') {
    return {
      deterministic_score: 0,
      signals: {
        deadline_urgency: 0,
        task_importance: 0,
        dependency_impact: 0,
        effort_efficiency: 0,
        project_importance: 0,
        hours_to_deadline: null,
        is_overdue: false,
        blocks_count: 0,
        is_blocked: false,
      },
      urgency_level: 'RELAXED',
      deadline_risk: 'LOW',
      preliminary_priority_label: 'LOW',
      deterministic_reasoning: 'Task is already completed.',
      weights_used: weights,
    };
  }

  // 1. Deadline Urgency (0 - 100) & Deadline Risk
  let deadlineUrgency = 10;
  let deadlineRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  let urgencyLevel: 'OVERDUE' | 'URGENT' | 'UPCOMING' | 'RELAXED' = 'RELAXED';
  let hoursToDeadline: number | null = null;
  let isOverdue = false;

  if (task.deadline) {
    const deadlineDate = new Date(task.deadline);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    hoursToDeadline = Math.round(diffMs / (1000 * 60 * 60));

    if (hoursToDeadline < 0) {
      // Overdue
      isOverdue = true;
      deadlineUrgency = 100;
      deadlineRisk = 'CRITICAL';
      urgencyLevel = 'OVERDUE';
    } else if (hoursToDeadline <= 24) {
      // < 24 hrs
      deadlineUrgency = Math.min(100, Math.round(90 + ((24 - hoursToDeadline) / 24) * 10));
      deadlineRisk = 'CRITICAL';
      urgencyLevel = 'URGENT';
    } else if (hoursToDeadline <= 72) {
      // 1-3 days
      deadlineUrgency = Math.round(70 + ((72 - hoursToDeadline) / 48) * 20);
      deadlineRisk = 'HIGH';
      urgencyLevel = 'URGENT';
    } else if (hoursToDeadline <= 168) {
      // 4-7 days
      deadlineUrgency = Math.round(45 + ((168 - hoursToDeadline) / 96) * 25);
      deadlineRisk = 'MEDIUM';
      urgencyLevel = 'UPCOMING';
    } else if (hoursToDeadline <= 336) {
      // 8-14 days
      deadlineUrgency = Math.round(25 + ((336 - hoursToDeadline) / 168) * 20);
      deadlineRisk = 'LOW';
      urgencyLevel = 'UPCOMING';
    } else {
      deadlineUrgency = 15;
      deadlineRisk = 'LOW';
      urgencyLevel = 'RELAXED';
    }
  }

  // 2. Task Importance (0 - 100)
  const importanceMap: Record<string, number> = {
    CRITICAL: 100,
    HIGH: 75,
    MEDIUM: 50,
    LOW: 25,
  };
  const taskImportance = importanceMap[task.importance?.toUpperCase()] ?? 50;

  // 3. Dependency Impact (0 - 100)
  const blocksCount = task.blocked_downstream_count || 0;
  let dependencyImpact = 15;
  if (blocksCount >= 3) {
    dependencyImpact = 100;
  } else if (blocksCount === 2) {
    dependencyImpact = 80;
  } else if (blocksCount === 1) {
    dependencyImpact = 55;
  }

  // 4. Effort Efficiency (0 - 100) - quick wins receive higher score
  const effortMinutes = Math.max(15, task.estimated_effort || 60);
  let effortEfficiency = 25;
  if (effortMinutes <= 60) {
    effortEfficiency = 95; // quick win
  } else if (effortMinutes <= 120) {
    effortEfficiency = 80;
  } else if (effortMinutes <= 240) {
    effortEfficiency = 60;
  } else if (effortMinutes <= 480) {
    effortEfficiency = 40;
  } else {
    effortEfficiency = 25;
  }

  // 5. Project Importance (0 - 100)
  const projImportance = importanceMap[task.project_importance?.toUpperCase() || ''] ?? 50;

  // Composite Deterministic Score
  const rawScore =
    wDeadline * deadlineUrgency +
    wImportance * taskImportance +
    wDependency * dependencyImpact +
    wEffort * effortEfficiency +
    wProject * projImportance;

  const deterministicScore = Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));

  // Determine preliminary label from normalized score
  let preliminaryPriorityLabel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  if (deterministicScore >= 80) {
    preliminaryPriorityLabel = 'CRITICAL';
  } else if (deterministicScore >= 60) {
    preliminaryPriorityLabel = 'HIGH';
  } else if (deterministicScore >= 35) {
    preliminaryPriorityLabel = 'MEDIUM';
  } else {
    preliminaryPriorityLabel = 'LOW';
  }

  // Build transparent deterministic reasoning
  const reasons: string[] = [];
  if (isOverdue) {
    reasons.push(`Task is OVERDUE by ${Math.abs(hoursToDeadline || 0)} hours (urgency=100)`);
  } else if (hoursToDeadline !== null && hoursToDeadline <= 48) {
    reasons.push(`Due in ${hoursToDeadline}h (urgency=${deadlineUrgency})`);
  }

  if (task.importance === 'CRITICAL' || task.importance === 'HIGH') {
    reasons.push(`Designated as ${task.importance} business importance`);
  }

  if (blocksCount > 0) {
    reasons.push(`Blocks ${blocksCount} downstream dependent task(s)`);
  }

  if (effortMinutes <= 60) {
    reasons.push(`High effort efficiency quick-win (~${effortMinutes}m)`);
  }

  const isBlocked = (task.unresolved_dependencies_count || 0) > 0 || task.status === 'BLOCKED';
  if (isBlocked) {
    reasons.push(`Waiting on unresolved dependencies`);
  }

  const deterministicReasoning = reasons.length > 0 ? reasons.join('. ') + '.' : 'Standard priority task based on baseline factors.';

  return {
    deterministic_score: deterministicScore,
    signals: {
      deadline_urgency: deadlineUrgency,
      task_importance: taskImportance,
      dependency_impact: dependencyImpact,
      effort_efficiency: effortEfficiency,
      project_importance: projImportance,
      hours_to_deadline: hoursToDeadline,
      is_overdue: isOverdue,
      blocks_count: blocksCount,
      is_blocked: isBlocked,
    },
    urgency_level: urgencyLevel,
    deadline_risk: deadlineRisk,
    preliminary_priority_label: preliminaryPriorityLabel,
    deterministic_reasoning: deterministicReasoning,
    weights_used: weights,
  };
}
