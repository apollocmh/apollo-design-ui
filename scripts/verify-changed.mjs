#!/usr/bin/env node
/** Stage-one impact feedback. Documentation does not requeue its component for a new audit. */
import { parseArgs } from 'node:util';
import { changedFiles, changedPlan, executePlan, ROOT } from './verification.mjs';

try {
  const { values } = parseArgs({
    options: {
      base: { type: 'string' },
      'dry-run': { type: 'boolean' },
      quiet: { type: 'boolean' },
      report: { type: 'string' },
      help: { type: 'boolean' },
    },
  });
  if (values.help)
    console.log(
      'verify-changed.mjs [--base git-ref] [--dry-run] [--report file] [--quiet]\nChecks changed production scopes and their consumers. Workflow changes use tooling tests; Docs changes use Docs checks.',
    );
  else {
    const plan = changedPlan(ROOT, changedFiles(ROOT, values.base));
    if (!plan.checks.length)
      console.log('[verification] No executable changes; no checks were marked passed.');
    else {
      const report = executePlan(plan, {
        quiet: values.quiet,
        dryRun: values['dry-run'],
        reportFile: values.report,
      });
      if (!values['dry-run'] && !report.passed) process.exitCode = 1;
    }
  }
} catch (error) {
  console.error(`[verify-changed] ${error.message}`);
  process.exitCode = 1;
}
