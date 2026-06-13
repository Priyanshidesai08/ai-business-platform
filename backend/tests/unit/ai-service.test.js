import test from 'node:test';
import assert from 'node:assert/strict';
import { createAiService, fallbackAiGenerate, parseAiJson } from '../../src/modules/ai/ai.service.js';

test('parseAiJson handles fenced json', () => {
  const result = parseAiJson('```json\n{"score":88}\n```');
  assert.deepEqual(result, { score: 88 });
});

test('fallbackAiGenerate provides a sales score response', () => {
  const result = fallbackAiGenerate('score this lead');
  assert.equal(result.category, 'Warm');
  assert.equal(result.score, 78);
});

test('generateAiResponse retries and records output', async () => {
  let callCount = 0;
  const execCalls = [];
  const { generateAiResponse } = createAiService({
    fetchImpl: async () => {
      callCount += 1;
      throw new Error('network down');
    },
    executeFn: async (...args) => execCalls.push(args),
    cacheGet: () => null,
    cacheSet: () => {},
    geminiApiKey: 'test-key',
    aiRetryCount: 2
  });

  await assert.rejects(
    generateAiResponse({
      userId: 'user-1',
      module: 'sales',
      prompt: 'score lead',
      cacheKey: 'user-1:sales:score'
    }),
    /network down/
  );

  assert.equal(callCount, 3);
  assert.equal(execCalls.length, 0);
});

test('generateAiResponse uses cached output when available', async () => {
  const { generateAiResponse } = createAiService({
    fetchImpl: async () => {
      throw new Error('should not be called');
    },
    executeFn: async () => {
      throw new Error('should not be called');
    },
    cacheGet: () => ({ score: 99 }),
    cacheSet: () => {}
  });

  const result = await generateAiResponse({
    userId: 'user-1',
    module: 'sales',
    prompt: 'score lead',
    cacheKey: 'cached-key'
  });

  assert.equal(result.cached, true);
  assert.deepEqual(result.response, { score: 99 });
});
