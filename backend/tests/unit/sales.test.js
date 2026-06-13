import test from 'node:test';
import assert from 'node:assert/strict';

const scoreToCategory = (score) => {
  if (score >= 75) return 'Hot';
  if (score >= 45) return 'Warm';
  return 'Cold';
};

test('score to category maps thresholds correctly', () => {
  assert.equal(scoreToCategory(80), 'Hot');
  assert.equal(scoreToCategory(60), 'Warm');
  assert.equal(scoreToCategory(10), 'Cold');
});

test('score to category handles edge thresholds', () => {
  assert.equal(scoreToCategory(75), 'Hot');
  assert.equal(scoreToCategory(45), 'Warm');
  assert.equal(scoreToCategory(44), 'Cold');
});
