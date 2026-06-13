import { execute, fetchAll, fetchOne } from '../../shared/db.js';
import { generateAiResponse } from '../ai/ai.service.js';
import { templates } from '../ai/prompt-templates.js';

const saveCampaign = async (userId, input, contentType, content) =>
  fetchOne(
    `INSERT INTO campaigns (user_id, audience, objective, tone, platform, content_type, content, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [userId, input.audience, input.objective, input.tone, input.platform, contentType, JSON.stringify(content), 'draft']
  );

const generateAndStore = async (userId, module, template, input, contentType) => {
  const prompt = templates[template]({ input });
  const result = await generateAiResponse({
    userId,
    module: 'marketing',
    prompt,
    cacheKey: `${userId}:marketing:${template}:${JSON.stringify(input)}`,
    metadata: { logAction: `marketing.${template}`, meta: input }
  });
  const campaign = await saveCampaign(userId, input, contentType, result.response);
  return { campaign, ai: result.response };
};

export const generatePost = (userId, input) => generateAndStore(userId, 'marketing', 'marketingPost', input, 'post');
export const generateEmail = (userId, input) => generateAndStore(userId, 'marketing', 'marketingEmail', input, 'email');
export const generateCampaign = (userId, input) => generateAndStore(userId, 'marketing', 'marketingCampaign', input, 'campaign');
export const generateAdCopy = (userId, input) => generateAndStore(userId, 'marketing', 'marketingAdCopy', input, 'adcopy');

export const listCampaigns = async (userId) => fetchAll(`SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC`, [userId]);

export const updateCampaignContent = async (userId, id, content) =>
  fetchOne(
    `UPDATE campaigns SET content = $3, updated_at = NOW()
     WHERE user_id = $1 AND id = $2
     RETURNING *`,
    [userId, id, JSON.stringify(content)]
  );
