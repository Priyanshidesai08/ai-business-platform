import { generateAiResponse } from '../ai/ai.service.js';
import { templates } from '../ai/prompt-templates.js';
import { createLead, deleteLead, getLead, listLeads, updateLead } from './lead.repository.js';
import { execute } from '../../shared/db.js';
import { ApiError } from '../../utils/apiError.js';

export const scoreToCategory = (score) => {
  if (score >= 75) return 'Hot';
  if (score >= 45) return 'Warm';
  return 'Cold';
};

export const createSalesService = ({ createLeadFn = createLead, updateLeadFn = updateLead, deleteLeadFn = deleteLead, getLeadFn = getLead, listLeadsFn = listLeads, generateAiFn = generateAiResponse, executeFn = execute } = {}) => {
  const createLeadService = async (userId, lead) => {
    const record = await createLeadFn(userId, lead);
    await executeFn(
      `INSERT INTO customers (user_id, lead_id, name, email, company, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (lead_id) DO UPDATE SET notes = EXCLUDED.notes`,
      [userId, record.id, record.name, record.email, record.company, record.notes]
    );
    return record;
  };

  const listLeadsService = async (userId) => listLeadsFn(userId);
  const getLeadService = async (userId, id) => getLeadFn(userId, id);

  const updateLeadService = async (userId, id, payload) => {
    const record = await updateLeadFn(userId, id, payload);
    if (!record) throw new ApiError(404, 'Lead not found');
    return record;
  };

  const deleteLeadService = async (userId, id) => {
    await deleteLeadFn(userId, id);
  };

  const scoreLeadService = async (userId, leadId) => {
    const lead = await getLeadFn(userId, leadId);
    if (!lead) throw new ApiError(404, 'Lead not found');
    const prompt = templates.leadScore({
      lead: {
        name: lead.name,
        email: lead.email,
        company: lead.company,
        budget: lead.budget,
        urgency: lead.urgency,
        companySize: lead.company_size,
        interest: lead.interest
      }
    });
    const result = await generateAiFn({
      userId,
      module: 'sales',
      prompt,
      cacheKey: `${userId}:sales:leadScore:${leadId}`,
      metadata: { logAction: 'sales.score', meta: { leadId } }
    });
    const score = Number(result.response.score || 0);
    const category = result.response.category || scoreToCategory(score);
    const updated = await updateLeadFn(userId, leadId, {
      score,
      category,
      notes: result.response.summary || lead.notes,
      followUp: result.response.followUp || lead.follow_up
    });
    return { lead: updated, ai: result.response };
  };

  const followUpLeadService = async (userId, leadId) => {
    const lead = await getLeadFn(userId, leadId);
    if (!lead) throw new ApiError(404, 'Lead not found');
    const prompt = templates.followUp({
      lead: { name: lead.name, email: lead.email, company: lead.company, interest: lead.interest }
    });
    const result = await generateAiFn({
      userId,
      module: 'sales',
      prompt,
      cacheKey: `${userId}:sales:followUp:${leadId}`,
      metadata: { logAction: 'sales.followup', meta: { leadId } }
    });
    const updated = await updateLeadFn(userId, leadId, {
      followUp: `${result.response.emailSubject}\n\n${result.response.emailBody}`
    });
    return { lead: updated, ai: result.response };
  };

  return {
    createLeadService,
    listLeadsService,
    getLeadService,
    updateLeadService,
    deleteLeadService,
    scoreLeadService,
    followUpLeadService
  };
};

const defaultSales = createSalesService();

export const createLeadService = defaultSales.createLeadService;
export const listLeadsService = defaultSales.listLeadsService;
export const getLeadService = defaultSales.getLeadService;
export const updateLeadService = defaultSales.updateLeadService;
export const deleteLeadService = defaultSales.deleteLeadService;
export const scoreLeadService = defaultSales.scoreLeadService;
export const followUpLeadService = defaultSales.followUpLeadService;
