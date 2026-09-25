import { execute } from './database';

export async function runMigrations(): Promise<void> {
  console.log('Running PostgreSQL relational schema migrations...');

  await execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      priority_weights JSONB DEFAULT '{"deadline": 0.35, "importance": 0.25, "dependency": 0.20, "effort": 0.10, "project": 0.10}'::jsonb,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      importance TEXT DEFAULT 'MEDIUM',
      color TEXT DEFAULT '#3b82f6',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      status TEXT DEFAULT 'TODO',
      category TEXT DEFAULT 'Feature',
      deadline TIMESTAMP WITH TIME ZONE,
      importance TEXT DEFAULT 'MEDIUM',
      estimated_effort INTEGER DEFAULT 60,
      manually_assigned_priority TEXT DEFAULT 'MEDIUM',
      ai_priority_score NUMERIC(5,2) DEFAULT 0,
      ai_priority_label TEXT DEFAULT 'MEDIUM',
      ai_explanation TEXT DEFAULT '',
      ai_deadline_risk TEXT DEFAULT 'LOW',
      ai_recommended_action TEXT DEFAULT '',
      ai_key_factors JSONB DEFAULT '[]'::jsonb,
      completed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS task_dependencies (
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      depends_on_task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (task_id, depends_on_task_id)
    );
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS task_priority_results (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      deterministic_score NUMERIC(5,2) NOT NULL,
      ai_score NUMERIC(5,2) NOT NULL,
      priority_label TEXT NOT NULL,
      deadline_risk TEXT NOT NULL,
      reasoning TEXT NOT NULL,
      recommended_action TEXT NOT NULL,
      key_factors JSONB NOT NULL,
      signals JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS ai_evaluations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      test_run_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      total_cases INTEGER NOT NULL,
      passed_cases INTEGER NOT NULL,
      schema_compliance_rate NUMERIC(5,2) NOT NULL,
      priority_accuracy NUMERIC(5,2) NOT NULL,
      deadline_risk_f1 NUMERIC(5,2) NOT NULL,
      avg_latency_ms NUMERIC(7,2) NOT NULL,
      test_results JSONB NOT NULL
    );
  `);

  // Indexes for relational performance
  await execute(`CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);`);
  await execute(`CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);`);
  await execute(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`);
  await execute(`CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);`);
  await execute(`CREATE INDEX IF NOT EXISTS idx_task_deps_task_id ON task_dependencies(task_id);`);
  await execute(`CREATE INDEX IF NOT EXISTS idx_task_deps_depends_on ON task_dependencies(depends_on_task_id);`);

  console.log('PostgreSQL schema migrations completed successfully.');
}
