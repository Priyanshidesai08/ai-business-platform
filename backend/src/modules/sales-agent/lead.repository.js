import { execute, fetchAll, fetchOne } from '../../shared/db.js';

export const createLead = async (userId, lead) => {
  const result = await fetchOne(
    `INSERT INTO leads
      (user_id, name, email, company, budget, urgency, company_size, interest, score, category, notes, follow_up, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      userId,
      lead.name,
      lead.email,
      lead.company || null,
      lead.budget || null,
      lead.urgency || null,
      lead.companySize || null,
      lead.interest || null,
      lead.score || 0,
      lead.category || 'Cold',
      lead.notes || '',
      lead.followUp || '',
      lead.status || 'new'
    ]
  );
  return result;
};

export const updateLead = async (userId, id, lead) => {
  const result = await fetchOne(
    `UPDATE leads SET
      name = COALESCE($3, name),
      email = COALESCE($4, email),
      company = COALESCE($5, company),
      budget = COALESCE($6, budget),
      urgency = COALESCE($7, urgency),
      company_size = COALESCE($8, company_size),
      interest = COALESCE($9, interest),
      score = COALESCE($10, score),
      category = COALESCE($11, category),
      notes = COALESCE($12, notes),
      follow_up = COALESCE($13, follow_up),
      status = COALESCE($14, status),
      updated_at = NOW()
     WHERE user_id = $1 AND id = $2
     RETURNING *`,
    [
      userId,
      id,
      lead.name ?? null,
      lead.email ?? null,
      lead.company ?? null,
      lead.budget ?? null,
      lead.urgency ?? null,
      lead.companySize ?? null,
      lead.interest ?? null,
      lead.score ?? null,
      lead.category ?? null,
      lead.notes ?? null,
      lead.followUp ?? null,
      lead.status ?? null
    ]
  );
  return result;
};

export const listLeads = async (userId) =>
  fetchAll(`SELECT * FROM leads WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);

export const getLead = async (userId, id) =>
  fetchOne(`SELECT * FROM leads WHERE user_id = $1 AND id = $2`, [userId, id]);

export const deleteLead = async (userId, id) =>
  execute(`DELETE FROM leads WHERE user_id = $1 AND id = $2`, [userId, id]);
