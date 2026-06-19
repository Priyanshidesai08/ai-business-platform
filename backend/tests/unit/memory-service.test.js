import test from 'node:test';
import assert from 'node:assert/strict';
import { createMemoryService } from '../../src/modules/memory/memory.service.js';
import { ApiError } from '../../src/utils/apiError.js';

test('saveMessage requires message text', async () => {
  const memory = createMemoryService();
  await assert.rejects(
    memory.saveMessage('user-1', { role: 'user', message: ' ' }),
    (error) => error instanceof ApiError && error.statusCode === 400
  );
});

test('saveSession persists session memory payload', async () => {
  const calls = [];
  const memory = createMemoryService({
    upsertSessionMemoryFn: async (input) => {
      calls.push(input);
      return { id: 'session-1', ...input };
    }
  });

  const result = await memory.saveSession('user-1', {
    sessionId: 'session-123',
    activeWork: 'Drafting notes',
    draft: 'Remember this'
  });

  assert.equal(result.id, 'session-1');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].sessionId, 'session-123');
  assert.equal(calls[0].payload.activeWork, 'Drafting notes');
});

test('saveAgentMemory requires an agent id', async () => {
  const memory = createMemoryService();
  await assert.rejects(
    memory.saveAgentMemory('user-1', '', {}),
    (error) => error instanceof ApiError && error.statusCode === 400
  );
});
