import test from 'node:test';
import assert from 'node:assert/strict';
import { createPromptService } from '../../src/modules/prompts/prompts.service.js';
import { ApiError } from '../../src/utils/apiError.js';

test('createPrompt stores prompt content', async () => {
  const calls = [];
  const service = createPromptService({
    createPromptFn: async (input) => {
      calls.push(input);
      return { id: 'prompt-1', ...input };
    }
  });

  const result = await service.createPrompt('user-1', { name: 'My Prompt', content: 'Hello' });
  assert.equal(result.id, 'prompt-1');
  assert.equal(calls[0].module, 'shared');
});

test('updatePrompt rejects missing prompt', async () => {
  const service = createPromptService({
    getPromptByIdFn: async () => null
  });

  await assert.rejects(
    service.updatePrompt('user-1', 'missing', { content: 'Updated' }),
    (error) => error instanceof ApiError && error.statusCode === 404
  );
});

test('restoreVersion uses version content', async () => {
  const service = createPromptService({
    getPromptVersionByIdFn: async () => ({ id: 'v1', prompt_id: 'p1', content: 'old', metadata: { note: 'v1' } }),
    getPromptByIdFn: async () => ({ id: 'p1', content: 'current' }),
    updatePromptByIdFn: async (_input) => ({ id: 'p1', content: 'old' })
  });

  const result = await service.restoreVersion('user-1', 'v1');
  assert.equal(result.version.id, 'v1');
  assert.equal(result.prompt.content, 'old');
});
