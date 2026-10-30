#!/usr/bin/env node
/** Docs checks reuse built packages; an independent clean checkout can explicitly build once. */
import { parseArgs } from 'node:util';
import { artifactDigest, docsPlan, executePlan, ROOT } from './verification.mjs';

try {
  const { values } = parseArgs({
    options: {
      build: { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      quiet: { type: 'boolean' },
      report: { type: 'string' },
      help: { type: 'boolean' },
    },
  });
  if (values.help)
    console.log(
      'verify-docs.mjs [--build] [--dry-run] [--report file] [--quiet]\nDefault: content/types/tests only, consuming existing artifacts. --build performs one full dependency-ordered build including SSG.',
    );
  else {
    let frozen;
    if (!values['dry-run'] && !values.build) frozen = artifactDigest(ROOT);
    const report = executePlan(docsPlan({ build: values.build }), {
      quiet: values.quiet,
      dryRun: values['dry-run'],
      reportFile: values.report,
      afterCheck(step) {
        if (step.kind === 'build') frozen = artifactDigest(ROOT);
        else if (frozen && artifactDigest(ROOT) !== frozen)
          throw new Error('Docs checks modified published artifacts');
      },
    });
    if (!values['dry-run'] && !report.passed) process.exitCode = 1;
  }
} catch (error) {
  console.error(`[verify-docs] ${error.message}`);
  process.exitCode = 1;
}
