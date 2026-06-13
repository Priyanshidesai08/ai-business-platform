import { fetchAll, fetchOne } from '../../shared/db.js';

export const buildReport = async (userId) => {
  const [leads, campaigns, tickets, logs] = await Promise.all([
    fetchAll(`SELECT * FROM leads WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
    fetchAll(`SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
    fetchAll(`SELECT * FROM tickets WHERE user_id = $1 ORDER BY created_at DESC`, [userId]),
    fetchAll(`SELECT * FROM activity_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, [userId])
  ]);

  const leadCount = leads.length;
  const campaignCount = campaigns.length;
  const ticketCount = tickets.length;
  const engagementRate = leadCount ? Number(((campaignCount + ticketCount) / leadCount) * 10).toFixed(2) : '0.00';
  const conversionRate = leadCount ? Number((leads.filter((lead) => lead.category === 'Hot').length / leadCount) * 100).toFixed(2) : '0.00';

  return {
    leads: leadCount,
    campaigns: campaignCount,
    ticketVolume: ticketCount,
    engagementRate,
    conversionRate,
    recentActivity: logs
  };
};

export const getConversions = async (userId) => {
  const rows = await fetchAll(
    `SELECT category, COUNT(*)::int AS total FROM leads WHERE user_id = $1 GROUP BY category`,
    [userId]
  );
  return rows;
};
