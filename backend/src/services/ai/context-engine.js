import { templates } from '../../modules/ai/prompt-templates.js';
import { getHistoryBySession, getSession } from '../../modules/memory/memory.service.js';
import { retrieveKnowledge } from '../../modules/knowledge/knowledge.service.js';
import { getPromptById, listPrompts as listPromptsRepository } from '../../modules/prompts/prompts.repository.js';

const stringify = (value) => JSON.stringify(value ?? {}, null, 2);

const buildPromptSource = async ({ userId, promptId, template, module, input }) => {
  if (promptId) {
    const prompt = await getPromptById({ userId, promptId });
    if (prompt) return { source: 'stored-prompt', prompt: prompt.content, promptRecord: prompt };
  }

  if (template && templates[template]) {
    return { source: 'template', prompt: templates[template](input || {}) };
  }

  const promptRecord = (await listPromptsRepository({ userId })).find((item) => item.module === module);
  if (promptRecord) {
    return { source: 'module-prompt', prompt: promptRecord.content, promptRecord };
  }

  return { source: 'inline', prompt: input?.prompt || '' };
};

export const createAiContextEngine = ({
  getHistoryBySessionFn = getHistoryBySession,
  getSessionFn = getSession,
  retrieveKnowledgeFn = retrieveKnowledge,
  buildPromptSourceFn = buildPromptSource
} = {}) => ({
  assembleContext: async ({ userId, module, template, promptId, input = {}, context = {} }) => {
    const sessionId = context.sessionId || input.sessionId || null;
    const memoryHistory = sessionId ? await getHistoryBySessionFn(userId, sessionId) : [];
    const sessionMemory = sessionId ? await getSessionFn(userId, sessionId) : null;
    const knowledge = await retrieveKnowledgeFn(userId, context.documentIds || input.documentIds || [], context.query || input.query || '');
    const promptSource = await buildPromptSourceFn({ userId, promptId, template, module, input });

    const assembledPrompt = [
      'You are the AI context engine for the AI Business Platform.',
      `Module: ${module}`,
      `Prompt source: ${promptSource.source}`,
      '',
      'SESSION MEMORY',
      stringify(sessionMemory?.payload || sessionMemory || {}),
      '',
      'CONVERSATION HISTORY',
      stringify(memoryHistory),
      '',
      'KNOWLEDGE HITS',
      stringify({
        documents: knowledge.documents || [],
        chunks: knowledge.chunks || [],
        context: knowledge.context || ''
      }),
      '',
      'PROMPT CONTENT',
      promptSource.prompt,
      '',
      'USER INPUT',
      stringify(input),
      '',
      'Return a concise, structured response.'
    ].join('\n');

    return {
      assembledPrompt,
      promptSource,
      memory: {
        sessionId,
        history: memoryHistory,
        session: sessionMemory
      },
      knowledge,
      promptRecord: promptSource.promptRecord || null
    };
  }
});

const defaultEngine = createAiContextEngine();

export const assembleAiContext = defaultEngine.assembleContext;
