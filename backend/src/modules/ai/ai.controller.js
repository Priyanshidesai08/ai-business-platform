import { generateAiResponse, generateContextualAiResponse } from './ai.service.js';
import { templates } from './prompt-templates.js';

export const generate = async (req, res, next) => {
  try {
    const { module, template, input } = req.body;
    const prompt = templates[template]?.({ ...input }) || input?.prompt || '';
    const cacheKey = `${req.user.id}:${module}:${template}:${JSON.stringify(input || {})}`;
    const result = await generateAiResponse({
      userId: req.user.id,
      module,
      prompt,
      cacheKey,
      metadata: { logAction: 'ai.generate', meta: { template, input } }
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const generateWithContext = async (req, res, next) => {
  try {
    const { module, template, promptId, input, context } = req.body;
    const cacheKey = `${req.user.id}:${module}:context:${template || promptId || 'inline'}:${JSON.stringify({ input, context })}`;
    const result = await generateContextualAiResponse({
      userId: req.user.id,
      module,
      template,
      promptId,
      input,
      context,
      cacheKey,
      metadata: { logAction: 'ai.context.generate', meta: { template, promptId, input, context } }
    });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
