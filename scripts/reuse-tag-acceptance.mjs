/** Reuse a completed acceptance on the identical commit when its version tag is pushed. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export const acceptanceCheckName = 'Complete nine-dimension acceptance on one frozen commit';

export function acceptedCheck(checks, sourceCommit) {
  return checks.find(
    (check) =>
      check.name === acceptanceCheckName &&
      check.head_sha === sourceCommit &&
      check.app?.slug === 'github-actions' &&
      check.status === 'completed' &&
      check.conclusion === 'success',
  );
}

async function main() {
  const { GITHUB_REPOSITORY, GITHUB_SHA, GITHUB_TOKEN, GITHUB_OUTPUT } = process.env;
  assert.equal(process.env.GITHUB_REF_TYPE, 'tag', 'Only a version tag may reuse acceptance');
  assert.ok(GITHUB_REPOSITORY && GITHUB_SHA && GITHUB_TOKEN && GITHUB_OUTPUT);
  const url = new URL(
    `https://api.github.com/repos/${GITHUB_REPOSITORY}/commits/${GITHUB_SHA}/check-runs`,
  );
  url.searchParams.set('check_name', acceptanceCheckName);
  url.searchParams.set('filter', 'all');
  url.searchParams.set('per_page', '100');
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2026-03-10',
    },
  });
  if (!response.ok) throw new Error(`Could not read acceptance checks: HTTP ${response.status}`);
  const payload = await response.json();
  assert.ok(Array.isArray(payload.check_runs), 'GitHub must return check runs');
  const check = acceptedCheck(payload.check_runs, GITHUB_SHA);
  fs.appendFileSync(GITHUB_OUTPUT, `reused=${Boolean(check)}\n`);
  if (check) {
    const reference = {
      kind: 'reused-acceptance',
      sourceCommit: GITHUB_SHA,
      checkRunId: check.id,
      verifiedCheck: check.name,
      conclusion: check.conclusion,
      url: check.html_url,
      completedAt: check.completed_at,
      note: 'The frozen commit already passed the complete acceptance. No new tests are claimed.',
    };
    fs.writeFileSync('/tmp/acceptance-reference.json', `${JSON.stringify(reference, null, 2)}\n`);
    console.log(`Reusing completed acceptance for ${GITHUB_SHA}: ${check.html_url}`);
  } else console.log('No completed acceptance for this commit; run the complete gate.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
