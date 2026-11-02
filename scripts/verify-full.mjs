#!/usr/bin/env node
/** One frozen build; the CLI and CI use the same complete check plan. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import {
  acceptanceLayerPlan,
  aggregateAcceptance,
  captureFrozenInputs,
  readLayerReports,
  verifyFrozenInputs,
} from './frozen-acceptance.mjs';
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
      layer: { type: 'string' },
      inputs: { type: 'string' },
      aggregate: { type: 'string' },
    },
  });
  if (values.help)
    console.log(
      'verify-full.mjs [--dry-run] [--report file] [--quiet]\\nCI: --layer build|runtime|types|consumers|visual|docs --inputs manifest.json\\nFinal aggregation: --aggregate reports-directory --inputs manifest.json\\nAll results must belong to one clean frozen SHA and one build.',
    );
  else {
    const plan = values.layer ? acceptanceLayerPlan(values.layer) : fullPlan();
    if (values['dry-run']) executePlan(plan, { dryRun: true });
    else {
      const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: ROOT,
        encoding: 'utf8',
      }).trim();
      let report = { stage: 'acceptance', sourceCommit, passed: false, checks: [] };
      try {
        const audit = JSON.parse(
          fs.readFileSync(path.join(ROOT, 'registry/vue-native-audit.json'), 'utf8'),
        );
        const remaining = audit.tasks.filter(
          (task) => task.architectureStatus !== 'done' || task.assignment !== null,
        );
        assert.equal(
          remaining.length,
          0,
          `Architecture work is incomplete or active (${remaining.length} tasks)`,
        );
        assertFrozenSource(ROOT, sourceCommit);
        if (values.aggregate) {
          if (process.env.ACCEPTANCE_JOB_RESULTS) {
            report.ciJobResults = JSON.parse(process.env.ACCEPTANCE_JOB_RESULTS);
          }
          const manifest = JSON.parse(fs.readFileSync(values.inputs, 'utf8'));
          const reports = readLayerReports(values.aggregate);
          report = aggregateAcceptance(reports, manifest, sourceCommit, report.ciJobResults);
        } else {
          plan.sourceCommit = sourceCommit;
          let artifacts;
          let manifest;
          if (values.layer) {
            assert.ok(values.inputs, 'A CI layer requires --inputs');
            if (values.layer !== 'build') {
              manifest = JSON.parse(fs.readFileSync(values.inputs, 'utf8'));
              verifyFrozenInputs(ROOT, manifest, sourceCommit);
              artifacts = manifest.artifactDigest;
              plan.provenance = {
                inputDigest: manifest.inputDigest,
                toolchain: manifest.toolchain,
              };
            }
          }
          report = executePlan(plan, {
            quiet: values.quiet,
            reportFile: values.report,
            afterCheck(step, currentReport) {
              assertFrozenSource(ROOT, sourceCommit);
              if (step.kind === 'build') artifacts = artifactDigest(ROOT);
              else if (artifacts)
                assert.equal(
                  artifactDigest(ROOT),
                  artifacts,
                  'Published artifacts changed during read-only acceptance',
                );
              if (manifest) verifyFrozenInputs(ROOT, manifest, sourceCommit);
              if (artifacts) currentReport.artifactDigest = artifacts;
            },
          });
          if (report.passed && values.layer === 'build') {
            manifest = captureFrozenInputs(ROOT, sourceCommit);
            fs.writeFileSync(values.inputs, `${JSON.stringify(manifest, null, 2)}\n`);
            report.provenance = {
              inputDigest: manifest.inputDigest,
              toolchain: manifest.toolchain,
            };
          }
          if (report.passed && values.layer === 'visual')
            report.visual = JSON.parse(
              fs.readFileSync(path.join(ROOT, 'tests/visual/report-apollo.json'), 'utf8'),
            );
        }
      } catch (error) {
        report.passed = false;
        report.error = error.message;
        console.error(`[verify-full] ${error.message}`);
      }
      if (values.report) fs.writeFileSync(values.report, `${JSON.stringify(report, null, 2)}\n`);
      if (!report.passed) process.exitCode = 1;
    }
  }
} catch (error) {
  console.error(`[verify-full] ${error.message}`);
  process.exitCode = 1;
}
