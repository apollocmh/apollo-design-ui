#!/usr/bin/env node
/** Stage-one feedback for a component and its explicitly requested checks. */
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { executePlan, focusedPlan, ROOT } from './verification.mjs';

try {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      quiet: { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      report: { type: 'string' },
      project: { type: 'string', multiple: true },
      'demo-script': { type: 'string', multiple: true },
      help: { type: 'boolean' },
    },
  });
  if (values.help)
    console.log(
      'verify-component.mjs <name> [--project dom-contract|a11y|theme] [--demo-script file] [--report file] [--dry-run] [--quiet]\nDefaults: focused unit, public types and local format. Full acceptance is a separate stage.',
    );
  else {
    const name = positionals[0];
    if (
      !name ||
      positionals.length !== 1 ||
      name.includes('/') ||
      !fs.existsSync(path.join(ROOT, 'packages/ui/src', name))
    )
      throw new Error('Choose one existing component name');
    const plan = focusedPlan(ROOT, [`packages/ui/src/${name}`], {
      projects: values.project ?? [],
      demoScripts: values['demo-script'] ?? [],
    });
    const report = executePlan(plan, {
      quiet: values.quiet,
      dryRun: values['dry-run'],
      reportFile: values.report,
    });
    if (!values['dry-run'] && !report.passed) process.exitCode = 1;
  }
} catch (error) {
  console.error(`[verify-component] ${error.message}`);
  process.exitCode = 1;
}
