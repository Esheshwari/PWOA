import bcrypt from 'bcryptjs';
import { config } from '../config/env';
import { execute, queryOne } from './database';

export async function runSeeds(): Promise<void> {
  if (!config.seedDemoData) {
    console.log('Demo seeding is disabled.');
    return;
  }

  const existingUser = await queryOne<{ id: string }>('SELECT id FROM users WHERE email = $1', ['demo@pwoa.dev']);
  if (existingUser) {
    console.log('Seed data already present, skipping.');
    return;
  }

  console.log('Seeding initial development projects and tasks...');

  const userId = 'usr_demo_pwoa_2026';
  const passwordHash = await bcrypt.hash('password123', 10);

  await execute(
    `INSERT INTO users (id, name, email, password_hash, priority_weights)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      userId,
      'Alex Mercer',
      'demo@pwoa.dev',
      passwordHash,
      JSON.stringify({
        deadline: 0.35,
        importance: 0.25,
        dependency: 0.20,
        effort: 0.10,
        project: 0.10,
      }),
    ]
  );

  // 3 Realistic Projects
  const projects = [
    {
      id: 'proj_saas_platform',
      name: 'Enterprise Cloud Platform v3',
      description: 'Core microservices migration, API gateway rollout, and zero-trust authentication.',
      importance: 'CRITICAL',
      color: '#6366f1', // Indigo
    },
    {
      id: 'proj_compliance_soc2',
      name: 'SOC-2 Type II Compliance & Audit',
      description: 'Security controls, audit logs retention, encryption at rest, and vulnerability remediation.',
      importance: 'HIGH',
      color: '#ef4444', // Red
    },
    {
      id: 'proj_mobile_experience',
      name: 'Executive Mobile App & Analytics',
      description: 'Cross-platform real-time metrics, push alerts, and offline caching sync.',
      importance: 'MEDIUM',
      color: '#10b981', // Emerald
    },
  ];

  for (const proj of projects) {
    await execute(
      `INSERT INTO projects (id, user_id, name, description, importance, color)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [proj.id, userId, proj.name, proj.description, proj.importance, proj.color]
    );
  }

  const now = new Date();
  const getDeadline = (daysOffset: number) => {
    const d = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    return d.toISOString();
  };

  // 17 Realistic Tasks across the 3 projects with varying deadlines, importance, effort, status
  const tasks = [
    // Project 1: Cloud Platform
    {
      id: 'task_001',
      project_id: 'proj_saas_platform',
      title: 'Fix Critical CVE-2026-8812 in API Gateway Auth Header',
      description: 'High-severity memory leak and token spoofing vulnerability in reverse proxy ingress handler.',
      status: 'IN_PROGRESS',
      category: 'Security',
      deadline: getDeadline(1), // due tomorrow!
      importance: 'CRITICAL',
      estimated_effort: 180, // 3h
      manually_assigned_priority: 'CRITICAL',
    },
    {
      id: 'task_002',
      project_id: 'proj_saas_platform',
      title: 'Migrate PostgreSQL Database Shards to Multi-Region Cluster',
      description: 'Provision cross-region read replicas and execute zero-downtime schema replication.',
      status: 'TODO',
      category: 'Infrastructure',
      deadline: getDeadline(3), // 3 days
      importance: 'HIGH',
      estimated_effort: 360, // 6h
      manually_assigned_priority: 'HIGH',
    },
    {
      id: 'task_003',
      project_id: 'proj_saas_platform',
      title: 'Implement Redis Distributed Rate Limiter for Public Endpoints',
      description: 'Protect against scraping and brute-force token generation with token bucket algorithm.',
      status: 'TODO',
      category: 'Security',
      deadline: getDeadline(2), // 2 days
      importance: 'HIGH',
      estimated_effort: 120, // 2h
      manually_assigned_priority: 'HIGH',
    },
    {
      id: 'task_004',
      project_id: 'proj_saas_platform',
      title: 'Refactor Legacy User Session Store to Stateless JWT Tokens',
      description: 'Replace sticky session server storage with asymmetric RS256 signed bearer tokens.',
      status: 'BLOCKED',
      category: 'Refactor',
      deadline: getDeadline(5), // 5 days
      importance: 'MEDIUM',
      estimated_effort: 240, // 4h
      manually_assigned_priority: 'MEDIUM',
    },
    {
      id: 'task_005',
      project_id: 'proj_saas_platform',
      title: 'Write Terraform Configuration for Kubernetes Ingress Controller',
      description: 'Declarative infrastructure as code for ingress controllers and automated TLS renewal.',
      status: 'COMPLETED',
      category: 'Infrastructure',
      deadline: getDeadline(-2), // 2 days ago
      importance: 'MEDIUM',
      estimated_effort: 120,
      manually_assigned_priority: 'MEDIUM',
    },
    {
      id: 'task_006',
      project_id: 'proj_saas_platform',
      title: 'Establish Grafana APM Dashboards & p99 Latency Alarms',
      description: 'Configure real-time OpenTelemetry metric collection, trace sampling, and PagerDuty routing.',
      status: 'TODO',
      category: 'Infrastructure',
      deadline: getDeadline(7),
      importance: 'MEDIUM',
      estimated_effort: 90,
      manually_assigned_priority: 'MEDIUM',
    },

    // Project 2: SOC-2 Compliance
    {
      id: 'task_007',
      project_id: 'proj_compliance_soc2',
      title: 'Implement Audit Trail Logging for Sensitive Admin Mutations',
      description: 'Ensure all user permission escalations, role grants, and project deletions write to tamper-proof S3 logs.',
      status: 'TODO',
      category: 'Security',
      deadline: getDeadline(-1), // Overdue by 1 day! High urgency!
      importance: 'CRITICAL',
      estimated_effort: 240, // 4h
      manually_assigned_priority: 'CRITICAL',
    },
    {
      id: 'task_008',
      project_id: 'proj_compliance_soc2',
      title: 'Rotate Root Production KMS Master Encryption Keys',
      description: 'Annual key rotation cycle and verification of envelope encryption for customer PII data.',
      status: 'TODO',
      category: 'Security',
      deadline: getDeadline(2), // 2 days
      importance: 'HIGH',
      estimated_effort: 90, // 1.5h
      manually_assigned_priority: 'HIGH',
    },
    {
      id: 'task_009',
      project_id: 'proj_compliance_soc2',
      title: 'Publish Incident Response Runbook for Data Breach Scenarios',
      description: 'Document escalation matrix, regulatory notification timeline (GDPR 72hr), and forensic imaging steps.',
      status: 'COMPLETED',
      category: 'Documentation',
      deadline: getDeadline(-5),
      importance: 'HIGH',
      estimated_effort: 150,
      manually_assigned_priority: 'HIGH',
    },
    {
      id: 'task_010',
      project_id: 'proj_compliance_soc2',
      title: 'Conduct Automated Static Code Analysis & Dependency License Audit',
      description: 'Integrate automated vulnerability scanning in GitHub Actions CI pipeline.',
      status: 'TODO',
      category: 'Security',
      deadline: getDeadline(8),
      importance: 'MEDIUM',
      estimated_effort: 60,
      manually_assigned_priority: 'MEDIUM',
    },
    {
      id: 'task_011',
      project_id: 'proj_compliance_soc2',
      title: 'Conduct Penetration Testing Remediation on Internal Bastion Host',
      description: 'Disable weak cipher suites, enforce hardware MFA for SSH bastions, and verify egress IP allowlisting.',
      status: 'BLOCKED',
      category: 'Security',
      deadline: getDeadline(4),
      importance: 'HIGH',
      estimated_effort: 180,
      manually_assigned_priority: 'HIGH',
    },

    // Project 3: Mobile Experience
    {
      id: 'task_012',
      project_id: 'proj_mobile_experience',
      title: 'Build Offline-First Sync Queue for Mobile Task Updates',
      description: 'Implement optimistic UI updates backed by local SQLite queue with automatic exponential backoff retry.',
      status: 'IN_PROGRESS',
      category: 'Feature',
      deadline: getDeadline(4),
      importance: 'HIGH',
      estimated_effort: 300,
      manually_assigned_priority: 'HIGH',
    },
    {
      id: 'task_013',
      project_id: 'proj_mobile_experience',
      title: 'Integrate APNS and FCM Push Notifications for Urgent Deadlines',
      description: 'Deliver actionable push notifications with deep links when high-priority tasks are assigned or due.',
      status: 'TODO',
      category: 'Feature',
      deadline: getDeadline(6),
      importance: 'MEDIUM',
      estimated_effort: 150,
      manually_assigned_priority: 'MEDIUM',
    },
    {
      id: 'task_014',
      project_id: 'proj_mobile_experience',
      title: 'Design Dark Mode System Palette and Contrast Ratios',
      description: 'Ensure all components satisfy WCAG 2.1 AA standards (minimum 4.5:1 text contrast) across OLED screens.',
      status: 'COMPLETED',
      category: 'Refactor',
      deadline: getDeadline(-3),
      importance: 'LOW',
      estimated_effort: 120,
      manually_assigned_priority: 'LOW',
    },
    {
      id: 'task_015',
      project_id: 'proj_mobile_experience',
      title: 'Optimize Core Web Vitals and Bundle Size Under 150kb',
      description: 'Implement dynamic chunk splitting, tree-shaking icon libraries, and modern image compression.',
      status: 'TODO',
      category: 'Bug',
      deadline: getDeadline(12),
      importance: 'LOW',
      estimated_effort: 60,
      manually_assigned_priority: 'LOW',
    },
    {
      id: 'task_016',
      project_id: 'proj_mobile_experience',
      title: 'Build Executive Daily Digest Summary Widget',
      description: 'Micro-card displaying velocity, unblocked tasks, and upcoming milestone forecast.',
      status: 'TODO',
      category: 'Feature',
      deadline: getDeadline(9),
      importance: 'MEDIUM',
      estimated_effort: 90,
      manually_assigned_priority: 'MEDIUM',
    },
  ];

  for (const t of tasks) {
    await execute(
      `INSERT INTO tasks (
        id, project_id, user_id, title, description, status, category,
        deadline, importance, estimated_effort, manually_assigned_priority,
        completed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        t.id,
        t.project_id,
        userId,
        t.title,
        t.description,
        t.status,
        t.category,
        t.deadline,
        t.importance,
        t.estimated_effort,
        t.manually_assigned_priority,
        t.status === 'COMPLETED' ? new Date().toISOString() : null,
      ]
    );
  }

  // Realistic Dependencies:
  // 1. task_004 (Stateless JWT Session Store) depends on task_001 (CVE API Gateway Auth fix)
  // 2. task_003 (Rate Limiter) depends on task_001 (CVE API Gateway Auth fix)
  // 3. task_011 (Bastion Host Pen Test Remediation) depends on task_008 (Rotate KMS Master Keys)
  // 4. task_013 (Push Notifications) depends on task_012 (Offline Sync Queue)
  const dependencies = [
    { task_id: 'task_004', depends_on: 'task_001' },
    { task_id: 'task_003', depends_on: 'task_001' },
    { task_id: 'task_011', depends_on: 'task_008' },
    { task_id: 'task_013', depends_on: 'task_012' },
  ];

  for (const dep of dependencies) {
    await execute(
      `INSERT INTO task_dependencies (task_id, depends_on_task_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [dep.task_id, dep.depends_on]
    );
  }

  console.log(`Seeded user ${userId}, 3 projects, 16 realistic tasks, and 4 dependencies.`);
}
