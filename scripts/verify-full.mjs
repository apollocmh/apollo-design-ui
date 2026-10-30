#!/usr/bin/env node
/** Stage two runs one frozen version, builds once and keeps published artifacts immutable. */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import {
  artifactDigest,
  assertFrozenSource,
  executePlan,
  fullPlan,
  ROOT,
} from './verification.mjs';

try {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean' },
      report: { type: 'string' },
      quiet: { type: 'boolean' },
      help: { type: 'boolean' },
    },
  });
  if (values.help)
    console.log(
      'verify-full.mjs [--dry-run] [--report file] [--quiet]\nFinal acceptance: architecture complete, clean frozen commit, one package build, immutable consumers. Dry-run only prints the plan.',
    );
  else {
    const plan = fullPlan();
    if (values['dry-run']) executePlan(plan, { dryRun: true });
    else {
      const audit = JSON.parse(
        fs.readFileSync(path.join(ROOT, 'registry/vue-native-audit.json'), 'utf8'),
      );
      const remaining = audit.tasks.filter(
        (task) => task.architectureStatus !== 'done' || task.assignment !== null,
      );
      if (remaining.length)
        throw new Error(
          `Architecture work is incomplete or active (${remaining.length} tasks); final acceptance has not started`,
        );
      const source = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' });
      if (source.status !== 0) throw new Error('Could not resolve frozen source');
      const sourceCommit = source.stdout.trim();
      plan.sourceCommit = sourceCommit;
      assertFrozenSource(ROOT, sourceCommit);
      let artifacts;
      const report = executePlan(plan, {
        quiet: values.quiet,
        reportFile: values.report,
        afterCheck(step) {
          assertFrozenSource(ROOT, sourceCommit);
          if (step.kind === 'build') artifacts = artifactDigest(ROOT);
          else if (artifacts && artifactDigest(ROOT) !== artifacts)
            throw new Error('Published artifacts changed during read-only acceptance');
        },
      });
      if (!report.passed) process.exitCode = 1;
    }
  }
} catch (error) {
  console.error(`[verify-full] ${error.message}`);
  process.exitCode = 1;
}
