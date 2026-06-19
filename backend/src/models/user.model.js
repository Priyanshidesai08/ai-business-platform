import { query } from '../config/db.js';

export const createUser = async ({ name, email, passwordHash, role = 'user' }) => {
  const result = await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at, reset_token, reset_token_expiry`,
    [name, email.toLowerCase(), passwordHash, role]
  );

  return result.rows[0];
};

export const findUserByEmail = async (email) => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return result.rows[0];
};

export const findUserById = async (id) => {
  const result = await query(
    'SELECT id, name, email, role, created_at, reset_token, reset_token_expiry FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

export const updateUserById = async (id, { name }) => {
  const result = await query(
    `UPDATE users
     SET name = COALESCE($2, name)
     WHERE id = $1
     RETURNING id, name, email, role, created_at, reset_token, reset_token_expiry`,
    [id, name ?? null]
  );

  return result.rows[0];
};

export const setPasswordResetToken = async (id, { token, expiry }) => {
  const result = await query(
    `UPDATE users
     SET reset_token = $2, reset_token_expiry = $3
     WHERE id = $1
     RETURNING id, name, email, role, created_at, reset_token, reset_token_expiry`,
    [id, token, expiry]
  );

  return result.rows[0];
};

export const findUserByResetToken = async (token) => {
  const result = await query(
    `SELECT *
     FROM users
     WHERE reset_token = $1
       AND reset_token_expiry IS NOT NULL
       AND reset_token_expiry > NOW()`,
    [token]
  );

  return result.rows[0];
};

export const clearPasswordResetToken = async (id) => {
  const result = await query(
    `UPDATE users
     SET reset_token = NULL, reset_token_expiry = NULL
     WHERE id = $1
     RETURNING id, name, email, role, created_at, reset_token, reset_token_expiry`,
    [id]
  );

  return result.rows[0];
};

export const updatePasswordById = async (id, passwordHash) => {
  const result = await query(
    `UPDATE users
     SET password = $2,
         reset_token = NULL,
         reset_token_expiry = NULL
     WHERE id = $1
     RETURNING id, name, email, role, created_at, reset_token, reset_token_expiry`,
    [id, passwordHash]
  );

  return result.rows[0];
};
