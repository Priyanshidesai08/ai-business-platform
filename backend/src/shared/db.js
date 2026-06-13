import { query } from '../config/db.js';

export const fetchOne = async (text, params = []) => {
  const result = await query(text, params);
  return result.rows[0];
};

export const fetchAll = async (text, params = []) => {
  const result = await query(text, params);
  return result.rows;
};

export const execute = async (text, params = []) => query(text, params);
