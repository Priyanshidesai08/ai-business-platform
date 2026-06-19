import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiContextEngine } from '../../src/services/ai/context-engine.js';

test('assembleContext includes memory, knowledge, and prompt content', async () => {
  const engine = createAiContextEngine({
    getHistoryBySessionFn: async () => [{ role: 'user', message: 'remember me' }],
    getSessionFn: async () => ({ payload: { activeWork: 'drafting' } }),
    retrieveKnowledgeFn: async () => ({
      documents: [{ id: 'doc-1', filename: 'guide.txt' }],
      chunks: [{ chunk_text: 'beta keyword' }],
      context: 'beta keyword'
    }),
    buildPromptSourceFn: async () => ({ source: 'template', prompt: 'Evaluate lead.' })
  });

  const result = await engine.assembleContext({
    userId: 'user-1',
    module: 'sales',
    template: 'leadScore',
    input: { lead: { name: 'Acme' } },
    context: { sessionId: 'session-1', documentIds: ['doc-1'], query: 'beta' }
  });

  assert.match(result.assembledPrompt, /SESSION MEMORY/);
  assert.match(result.assembledPrompt, /KNOWLEDGE HITS/);
  assert.match(result.assembledPrompt, /PROMPT CONTENT/);
  assert.equal(result.memory.sessionId, 'session-1');
  assert.equal(result.knowledge.context, 'beta keyword');
});
