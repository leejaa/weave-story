import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export function makeDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema, casing: 'snake_case' });
}

export type DB = ReturnType<typeof makeDb>;
