import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl
});

export const query = (text, params) => pool.query(text, params);

export const testDatabaseConnection = async () => {
  const result = await query('SELECT NOW()');
  console.log(`PostgreSQL connected at ${result.rows[0].now.toISOString()}`);
};
