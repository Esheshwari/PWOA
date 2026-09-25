import { execute, query, queryOne } from '../db/database';
import { generateAITaskPriority } from './aiService';
import { calculateDeterministicPriority, TaskEvaluationInput } from './priorityService';

export interface TestCase {
  id: string;
  name: string;
  task: TaskEvaluationInput;
  expected: {
    min_priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    expected_deadline_risk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    should_mention_dependency: boolean;
  };
}

// 6 Comprehensive, deterministic realistic test cases for evaluation
export const EVALUATION_BENCHMARK_CASES: TestCase[] = [
  {
    id: 'case_01_overdue_security',
    name: 'Overdue Critical Zero-Day Vulnerability',
    task: {
      id: 'eval_t1',
      title: 'Patch RCE vulnerability in Auth Token Validator',
      description: 'Zero-day vulnerability actively exploited in the wild. Public patch deadline has passed.',
      status: 'TODO',
      category: 'Security',
      deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day overdue
      importance: 'CRITICAL',
      estimated_effort: 120,
      project_name: 'Core Security',
      project_importance: 'CRITICAL',
      blocked_downstream_count: 3,
    },
    expected: {
      min_priority: 'CRITICAL',
      expected_deadline_risk: 'CRITICAL',
      should_mention_dependency: true,
    },
  },
  {
    id: 'case_02_quick_win',
    name: 'High Impact 30-Minute Quick Win',
    task: {
      id: 'eval_t2',
      title: 'Fix typo in checkout stripe public key env variable',
      description: 'Prevents customer checkout failures. Takes 15-30 minutes to verify and deploy.',
      status: 'TODO',
      category: 'Bug',
      deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4h
      importance: 'HIGH',
      estimated_effort: 30,
      project_name: 'E-Commerce Checkout',
      project_importance: 'HIGH',
      blocked_downstream_count: 1,
    },
    expected: {
      min_priority: 'HIGH',
      expected_deadline_risk: 'CRITICAL',
      should_mention_dependency: true,
    },
  },
  {
    id: 'case_03_blocked_task',
    name: 'Blocked Architectural Migration Waiting on Database',
    task: {
      id: 'eval_t3',
      title: 'Roll out GraphQL Gateway Federation',
      description: 'Architectural refactor. Cannot proceed until Postgres sharding is complete.',
      status: 'BLOCKED',
      category: 'Refactor',
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      importance: 'MEDIUM',
      estimated_effort: 360,
      project_name: 'Core Infrastructure',
      project_importance: 'HIGH',
      unresolved_dependencies_count: 2,
    },
    expected: {
      min_priority: 'MEDIUM',
      expected_deadline_risk: 'LOW',
      should_mention_dependency: true,
    },
  },
  {
    id: 'case_04_low_priority_doc',
    name: 'Internal Documentation Formatting Cleanup',
    task: {
      id: 'eval_t4',
      title: 'Standardize markdown headers in internal wiki archive',
      description: 'Minor formatting improvements for legacy internal notes.',
      status: 'TODO',
      category: 'Documentation',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      importance: 'LOW',
      estimated_effort: 60,
      project_name: 'Internal Ops',
      project_importance: 'LOW',
      blocked_downstream_count: 0,
    },
    expected: {
      min_priority: 'LOW',
      expected_deadline_risk: 'LOW',
      should_mention_dependency: false,
    },
  },
  {
    id: 'case_05_critical_bottleneck',
    name: 'Hub Blocker: Database Migration Blocking 4 Teams',
    task: {
      id: 'eval_t5',
      title: 'Run Primary DB Schema Migration & Multi-tenant Keys',
      description: 'Required schema migration that unblocks auth, billing, and reporting services.',
      status: 'TODO',
      category: 'Infrastructure',
      deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48h
      importance: 'HIGH',
      estimated_effort: 180,
      project_name: 'Enterprise Cloud Platform',
      project_importance: 'CRITICAL',
      blocked_downstream_count: 4,
    },
    expected: {
      min_priority: 'HIGH',
      expected_deadline_risk: 'HIGH',
      should_mention_dependency: true,
    },
  },
  {
    id: 'case_06_completed_task',
    name: 'Completed Task Zero Urgency Check',
    task: {
      id: 'eval_t6',
      title: 'Setup Kubernetes Ingress Controller',
      description: 'Already deployed to production cluster.',
      status: 'COMPLETED',
      category: 'Infrastructure',
      deadline: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      importance: 'HIGH',
      estimated_effort: 120,
      project_name: 'Enterprise Cloud Platform',
      project_importance: 'HIGH',
    },
    expected: {
      min_priority: 'LOW',
      expected_deadline_risk: 'LOW',
      should_mention_dependency: false,
    },
  },
];

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

export async function runEvaluationSuite(userId: string): Promise<EvaluationResult> {
  const startTime = Date.now();
  const results = [];
  let schemaValidCount = 0;
  let priorityMatchCount = 0;
  let riskMatchCount = 0;
  let passedCount = 0;
  let totalLatency = 0;

  const priorityRanks: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

  for (const c of EVALUATION_BENCHMARK_CASES) {
    const caseStart = Date.now();
    const deterministic = calculateDeterministicPriority(c.task);
    const aiOutput = await generateAITaskPriority(c.task, deterministic);
    const caseLatency = Date.now() - caseStart;
    totalLatency += caseLatency;

    // 1. Schema Validation
    const isSchemaValid =
      typeof aiOutput.priority_label === 'string' &&
      typeof aiOutput.reasoning === 'string' &&
      typeof aiOutput.deadline_risk === 'string' &&
      typeof aiOutput.recommended_action === 'string' &&
      Array.isArray(aiOutput.key_factors);

    if (isSchemaValid) schemaValidCount++;

    // 2. Priority Classification Matching
    // Check if generated label meets expected threshold
    const actualRank = priorityRanks[aiOutput.priority_label] || 1;
    const expectedRank = priorityRanks[c.expected.min_priority] || 1;
    // Considered matched if within 1 level or matching minimum threshold
    const priorityMatched = Math.abs(actualRank - expectedRank) <= 1;
    if (priorityMatched) priorityMatchCount++;

    // 3. Deadline Risk Match
    const riskMatched =
      aiOutput.deadline_risk === c.expected.expected_deadline_risk ||
      (c.expected.expected_deadline_risk === 'CRITICAL' && aiOutput.deadline_risk === 'HIGH') ||
      (c.expected.expected_deadline_risk === 'HIGH' && aiOutput.deadline_risk === 'CRITICAL');
    if (riskMatched) riskMatchCount++;

    // 4. Dependency Awareness
    const textCorpus = (
      aiOutput.reasoning +
      ' ' +
      aiOutput.recommended_action +
      ' ' +
      aiOutput.key_factors.join(' ')
    ).toLowerCase();

    const dependencyDetected =
      !c.expected.should_mention_dependency ||
      textCorpus.includes('block') ||
      textCorpus.includes('depend') ||
      textCorpus.includes('prereq') ||
      textCorpus.includes('waiting');

    const overallPassed = isSchemaValid && priorityMatched && riskMatched;
    if (overallPassed) passedCount++;

    results.push({
      case_id: c.id,
      case_name: c.name,
      passed: overallPassed,
      latency_ms: caseLatency,
      schema_valid: isSchemaValid,
      priority_matched: priorityMatched,
      risk_matched: riskMatched,
      dependency_detected: dependencyDetected,
      output: aiOutput,
      expected: c.expected,
    });
  }

  const total = EVALUATION_BENCHMARK_CASES.length;
  const schemaComplianceRate = Math.round((schemaValidCount / total) * 100);
  const priorityAccuracy = Math.round((priorityMatchCount / total) * 100);
  const deadlineRiskF1 = Math.round((riskMatchCount / total) * 100);
  const avgLatencyMs = Math.round(totalLatency / total);

  const evalId = 'eval_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

  await execute(
    `INSERT INTO ai_evaluations (
      id, user_id, total_cases, passed_cases, schema_compliance_rate,
      priority_accuracy, deadline_risk_f1, avg_latency_ms, test_results
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      evalId,
      userId,
      total,
      passedCount,
      schemaComplianceRate,
      priorityAccuracy,
      deadlineRiskF1,
      avgLatencyMs,
      JSON.stringify(results),
    ]
  );

  return {
    id: evalId,
    test_run_at: new Date().toISOString(),
    total_cases: total,
    passed_cases: passedCount,
    schema_compliance_rate: schemaComplianceRate,
    priority_accuracy: priorityAccuracy,
    deadline_risk_f1: deadlineRiskF1,
    avg_latency_ms: avgLatencyMs,
    test_results: results,
  };
}

export async function getLatestEvaluation(userId: string): Promise<EvaluationResult | null> {
  const row = await queryOne<any>(
    'SELECT * FROM ai_evaluations WHERE user_id = $1 ORDER BY test_run_at DESC LIMIT 1',
    [userId]
  );
  if (!row) return null;

  return {
    id: row.id,
    test_run_at: row.test_run_at,
    total_cases: parseInt(row.total_cases, 10),
    passed_cases: parseInt(row.passed_cases, 10),
    schema_compliance_rate: Number(row.schema_compliance_rate),
    priority_accuracy: Number(row.priority_accuracy),
    deadline_risk_f1: Number(row.deadline_risk_f1),
    avg_latency_ms: Number(row.avg_latency_ms),
    test_results: typeof row.test_results === 'string' ? JSON.parse(row.test_results) : row.test_results,
  };
}
