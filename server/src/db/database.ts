import { neon } from '@neondatabase/serverless';
import { PGlite } from '@electric-sql/pglite';
import { config } from '../config/env';

interface DatabaseClient {
  query(sql: string, params?: any[]): Promise<any[]>;
}

let dbInstance: DatabaseClient | null = null;

export async function getDb(): Promise<DatabaseClient> {
  if (dbInstance) {
    return dbInstance;
  }

  if (config.databaseUrl) {
    const sql = neon(config.databaseUrl);
    dbInstance = {
      query: (statement, params = []) => sql.query(statement, params),
    };
  } else {
    const pglite = new PGlite();
    dbInstance = {
      query: async (statement, params = []) => (await pglite.query(statement, params)).rows,
    };
  }

  return dbInstance;
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDb();
  return await db.query(sql, params) as T[];
}

export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export async function execute(sql: string, params: any[] = []): Promise<void> {
  const db = await getDb();
  await db.query(sql, params);
}
