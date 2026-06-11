import { query } from '../config/db.js';

export const createSession = async ({ id, userId, token }) => {
  const result = await query(
    `INSERT INTO sessions (id, user_id, token)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, created_at, revoked_at`,
    [id, userId, token]
  );

  return result.rows[0];
};

export const findActiveSessionByToken = async (token) => {
  const result = await query(
    `SELECT * FROM sessions
     WHERE token = $1 AND revoked_at IS NULL`,
    [token]
  );

  return result.rows[0];
};

export const revokeSessionByToken = async (token) => {
  await query(
    `UPDATE sessions
     SET revoked_at = NOW()
     WHERE token = $1 AND revoked_at IS NULL`,
    [token]
  );
};
