import { PGlite } from '@electric-sql/pglite';

let dbInstance: PGlite | null = null;

export async function getDb(): Promise<PGlite> {
  if (dbInstance) {
    return dbInstance;
  }

  // Pure in-memory Postgres WASM engine: fast, zero file-locking collisions, full relational integrity
  dbInstance = new PGlite();
  return dbInstance;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  const result = await db.query(sql, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sql: string, params: any[] = []): Promise<void> {
  const db = await getDb();
  await db.query(sql, params);
}
