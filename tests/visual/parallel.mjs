#!/usr/bin/env node
/** Compare the existing Apollo matrix in five component-owned workers. */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { buildCases } from './matrix.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const WORKERS = 5;

export function groupVisualCases(cases) {
  const components = new Map();
  for (const item of cases) {
    if (!components.has(item.component)) components.set(item.component, []);
    components.get(item.component).push(item.id);
  }
  const groups = Array.from({ length: WORKERS }, () => ({ components: [], ids: [] }));
  const ordered = [...components].sort(
    ([a, idsA], [b, idsB]) => idsB.length - idsA.length || a.localeCompare(b),
  );
  for (const [component, ids] of ordered) {
    const group = groups.reduce((least, next) =>
      next.ids.length < least.ids.length ? next : least,
    );
    group.components.push(component);
    group.ids.push(...ids);
  }
  return groups;
}

export function mergeVisualReports(cases, groups, outcomes) {
  const expected = new Set(cases.map((item) => item.id));
  const errors = [],
    results = [],
    seen = new Set();
  let pending = 0,
    pendingKnown = true;
  if (expected.size !== cases.length) errors.push('The expected matrix contains duplicate IDs');
  if (groups.length !== WORKERS || outcomes.length !== WORKERS)
    errors.push(`Expected ${WORKERS} worker outcomes, received ${outcomes.length}`);
  const workers = groups.map((group, index) => {
    const worker = outcomes[index] ?? { exitCode: null, signal: null, error: 'Worker did not run' };
    const { report, ...outcome } = worker;
    const label = `Worker ${index + 1}`;
    if (worker.exitCode !== 0 || worker.signal !== null)
      errors.push(`${label}: exitCode=${worker.exitCode}, signal=${worker.signal}`);
    if (worker.error) errors.push(`${label}: ${worker.error}`);
    const metadata = { ...outcome, components: group.components };
    if (!report || typeof report !== 'object' || !Array.isArray(report.results)) {
      errors.push(`${label}: missing or invalid report`);
      pendingKnown = false;
      return metadata;
    }
    const { results: rows, ...reportMetadata } = report;
    if (report.expected !== group.ids.length || rows.length !== group.ids.length)
      errors.push(
        `${label}: expected ${group.ids.length} results, declared ${report.expected}, got ${rows.length}`,
      );
    if (!Number.isInteger(report.pending) || report.pending < 0) {
      errors.push(`${label}: invalid pending count`);
      pendingKnown = false;
    } else {
      pending += report.pending;
      if (report.pending !== 0) errors.push(`${label}: ${report.pending} pending baselines`);
    }
    const assigned = new Set(group.ids),
      received = new Set();
    for (const row of rows) {
      if (!row || typeof row.id !== 'string') {
        errors.push(`${label}: result has no case ID`);
        continue;
      }
      results.push(row);
      if (!assigned.has(row.id)) errors.push(`${label}: unassigned ID ${row.id}`);
      if (seen.has(row.id)) errors.push(`${label}: duplicate ID ${row.id}`);
      seen.add(row.id);
      received.add(row.id);
      if (row.verdict !== 'PASS') errors.push(`${label}: ${row.id}: ${row.verdict}`);
    }
    for (const id of assigned) if (!received.has(id)) errors.push(`${label}: missing ID ${id}`);
    return { ...metadata, report: reportMetadata };
  });
  for (const id of expected) if (!seen.has(id)) errors.push(`Missing expected ID ${id}`);
  for (const id of seen) if (!expected.has(id)) errors.push(`Unexpected ID ${id}`);
  const order = new Map(cases.map((item, index) => [item.id, index]));
  results.sort((a, b) => (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity));
  return {
    expected: cases.length,
    pending: pendingKnown ? pending : null,
    results,
    workers,
    errors,
    passed: errors.length === 0,
  };
}

function runWorker(group, reportFile, children) {
  const args = [
    path.join(HERE, 'apollo.mjs'),
    '--no-build',
    '--report-file',
    reportFile,
    ...group.components.flatMap((component) => ['--component', component]),
  ];
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: ROOT,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    children.add(child);
    let error;
    child.once('error', (failure) => {
      error = failure.message;
    });
    child.once('close', (exitCode, signal) => {
      children.delete(child);
      let report;
      try {
        report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
      } catch (failure) {
        error = [error, `Cannot read ${reportFile}: ${failure.message}`].filter(Boolean).join('; ');
      }
      resolve({ exitCode, signal, reportFile, error, report });
    });
  });
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: {
      'no-build': { type: 'boolean' },
      'report-file': { type: 'string' },
      help: { type: 'boolean' },
    },
  });
  if (values.help) {
    console.log(
      'Apollo visual comparison, five component-owned workers\n  --no-build          Reuse the existing Vue visual fixture\n  --report-file PATH  Aggregate report (default tests/visual/report-apollo.json)\n  --help',
    );
    return;
  }
  const { assertNativeRenderingEnvironment, readNativeRenderingEnvironment } = await import(
    './environment.mjs'
  );
  assertNativeRenderingEnvironment(readNativeRenderingEnvironment());
  const cases = buildCases({ apollo: true });
  if (cases.length !== 1875 || new Set(cases.map((item) => item.id)).size !== 1875)
    throw new Error('Expected the complete 1875 unique Apollo visual IDs');
  const groups = groupVisualCases(cases);
  const reportFile = path.resolve(values['report-file'] ?? path.join(HERE, 'report-apollo.json'));
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-visual-parallel-'));
  const children = new Set();
  let outcomes = [],
    failure,
    interrupted;
  const stop = (signal) => {
    interrupted = signal;
    for (const child of children) child.kill(signal);
  };
  const onInterrupt = () => stop('SIGINT'),
    onTerminate = () => stop('SIGTERM');
  process.once('SIGINT', onInterrupt);
  process.once('SIGTERM', onTerminate);
  try {
    if (!values['no-build']) {
      const { buildSide } = await import('./build.mjs');
      await buildSide('vue', path.join(HERE, '.artifacts/vue'));
    }
    if (!interrupted) {
      console.log(`Apollo parallel: ${groups.map((group) => group.ids.length).join('+')} cases`);
      outcomes = await Promise.all(
        groups.map((group, index) =>
          runWorker(group, path.join(temporary, `worker-${index + 1}.json`), children),
        ),
      );
    }
  } catch (error) {
    failure = error.message;
  } finally {
    process.removeListener('SIGINT', onInterrupt);
    process.removeListener('SIGTERM', onTerminate);
  }
  const report = mergeVisualReports(cases, groups, outcomes);
  if (failure || interrupted) {
    report.errors.push(failure ?? `Interrupted by ${interrupted}`);
    report.passed = false;
  }
  fs.mkdirSync(path.dirname(reportFile), { recursive: true });
  fs.writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Apollo parallel: ${report.results.length}/${report.expected}; report=${reportFile}`);
  if (!report.passed) {
    console.error(report.errors.slice(0, 10).join('\n'));
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  fs.existsSync(process.argv[1]) &&
  fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))
) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
