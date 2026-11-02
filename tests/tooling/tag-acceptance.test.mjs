import assert from 'node:assert/strict';
import test from 'node:test';
import { acceptanceCheckName, acceptedCheck } from '../../scripts/reuse-tag-acceptance.mjs';

const sourceCommit = 'a'.repeat(40);
const completed = {
  id: 42,
  name: acceptanceCheckName,
  head_sha: sourceCommit,
  app: { slug: 'github-actions' },
  status: 'completed',
  conclusion: 'success',
};

test('tag acceptance reuses only the completed full gate on the identical source', () => {
  assert.equal(
    acceptedCheck([{ ...completed, status: 'in_progress' }, completed], sourceCommit),
    completed,
  );
  assert.equal(acceptedCheck([], sourceCommit), undefined);
});

test('partial checks, other sources/apps and non-success conclusions cannot approve a tag', () => {
  for (const check of [
    { ...completed, name: 'Architecture feedback for changed scopes' },
    { ...completed, head_sha: 'b'.repeat(40) },
    { ...completed, app: { slug: 'another-app' } },
    { ...completed, app: undefined },
    ...['failure', 'cancelled', 'skipped', 'neutral', 'timed_out'].map((conclusion) => ({
      ...completed,
      conclusion,
    })),
  ])
    assert.equal(acceptedCheck([check], sourceCommit), undefined);
});
