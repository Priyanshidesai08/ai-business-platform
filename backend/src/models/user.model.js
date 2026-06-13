import { query } from '../config/db.js';

export const createUser = async ({ name, email, passwordHash, role = 'user' }) => {
  const result = await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
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
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

export const updateUserById = async (id, { name }) => {
  const result = await query(
    `UPDATE users
     SET name = COALESCE($2, name)
     WHERE id = $1
     RETURNING id, name, email, role, created_at`,
    [id, name ?? null]
  );

  return result.rows[0];
};
