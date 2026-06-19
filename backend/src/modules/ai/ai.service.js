import { env } from '../../config/env.js';
import { fetchOne, execute } from '../../shared/db.js';
import { getCachedGeneration, setCachedGeneration } from './ai.cache.js';
import { assembleAiContext } from '../../services/ai/index.js';

export const parseAiJson = (text) => {
  if (!text) return {};
  const trimmed = text.trim();
  if (trimmed.startsWith('```')) {
    return JSON.parse(trimmed.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim());
  }
  return JSON.parse(trimmed);
};

export const fallbackAiGenerate = (prompt) => {
  if (prompt.includes('score')) {
    return {
      score: 78,
      category: 'Warm',
      summary: 'Lead shows clear interest and reasonable urgency.',
      followUp: 'Thank them for the interest and ask for a short discovery call.',
      nextAction: 'Schedule a discovery call within 24 hours.'
    };
  }

  if (prompt.includes('follow-up email')) {
    return {
      emailSubject: 'Quick follow-up on your request',
      emailBody: 'Thanks for reaching out. I wanted to follow up and offer a short call to review next steps.',
      nextAction: 'Send follow-up email and propose a meeting.'
    };
  }

  if (prompt.includes('social post')) {
    return { title: 'Campaign Post', content: 'A compelling social post highlighting the offer and clear CTA.' };
  }

  if (prompt.includes('marketing email')) {
    return { subject: 'A helpful update for your team', body: 'A concise email with value, proof, and CTA.' };
  }

  if (prompt.includes('campaign plan')) {
    return { name: 'Launch Campaign', description: 'Multi-step campaign for lead generation.', content: 'Campaign structure with audience, message, CTA, and timeline.' };
  }

  if (prompt.includes('ad copy')) {
    return { primaryText: 'Ad copy focused on outcomes and urgency.', headline: 'Grow Faster', description: 'Clear offer and CTA.' };
  }

  if (prompt.includes('support assistant')) {
    return { response: 'I can help with that. Here is a practical next step.', sentiment: 'neutral', suggestedStatus: 'open' };
  }

  if (prompt.includes('business data')) {
    return { insights: ['Lead volume is stable.', 'Campaigns need optimization.'], recommendations: ['Improve follow-up cadence.'] };
  }

  return { content: 'AI output unavailable; fallback response generated.' };
};

export const createAiService = ({ fetchImpl = fetch, executeFn = execute, fetchOneFn = fetchOne, cacheGet = getCachedGeneration, cacheSet = setCachedGeneration, geminiApiKey = env.geminiApiKey, aiModel = env.aiModel, aiTimeoutMs = env.aiTimeoutMs, aiRetryCount = env.aiRetryCount, aiCacheTtlMs = env.aiCacheTtlMs } = {}) => {
  const callGemini = async (prompt) => {
    if (!geminiApiKey) {
      return fallbackAiGenerate(prompt);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), aiTimeoutMs);

    try {
      const response = await fetchImpl(
        `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.5
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini request failed with status ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return parseAiJson(text);
    } finally {
      clearTimeout(timeout);
    }
  };

  const generateAiResponse = async ({ userId, module, prompt, cacheKey, metadata = {} }) => {
    const cached = cacheGet(cacheKey);
    if (cached) {
      return { response: cached, cached: true, tokensUsed: 0, model: aiModel };
    }

    let lastError = null;
    for (let attempt = 0; attempt <= aiRetryCount; attempt += 1) {
      try {
        const response = await callGemini(prompt);
        const result = {
          response,
          cached: false,
          tokensUsed: JSON.stringify(response).length,
          model: aiModel
        };
        cacheSet(cacheKey, result.response, aiCacheTtlMs);
        await executeFn(
          `INSERT INTO ai_generations (user_id, module, prompt, response, tokens_used, model, cached)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [userId, module, prompt, JSON.stringify(response), result.tokensUsed, result.model, result.cached]
        );
        if (metadata.logAction) {
          await executeFn(
            `INSERT INTO activity_logs (user_id, module, action, meta)
             VALUES ($1, $2, $3, $4)`,
            [userId, module, metadata.logAction, JSON.stringify(metadata.meta || {})]
          );
        }
        return result;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  };

  return { generateAiResponse, callGemini };
};

const defaultAi = createAiService();

export const generateAiResponse = defaultAi.generateAiResponse;

export const generateContextualAiResponse = async ({ userId, module, promptId, template, input = {}, context = {}, cacheKey, metadata = {} }) => {
  const assembled = await assembleAiContext({
    userId,
    module,
    template,
    promptId,
    input,
    context
  });

  const result = await generateAiResponse({
    userId,
    module,
    prompt: assembled.assembledPrompt,
    cacheKey,
    metadata
  });

  return {
    ...result,
    context: assembled
  };
};

export const loadLatestGeneration = async (userId, module) =>
  fetchOne(
    `SELECT * FROM ai_generations
     WHERE user_id = $1 AND module = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, module]
  );
