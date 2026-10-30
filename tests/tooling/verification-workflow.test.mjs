import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  artifactDigest,
  assertFrozenSource,
  changedPlan,
  docsPlan,
  executePlan,
  focusedPlan,
  fullPlan,
} from '../../scripts/verification.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-verification-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, text) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), text);
  };
  const components = [
    {
      name: 'button',
      dependencies: { components: [], typeOnly: [], foundation: ['@apollo-design/theme'] },
    },
    { name: 'input', dependencies: { components: ['button'], typeOnly: [], foundation: [] } },
    { name: 'qr-code', dependencies: { components: [], typeOnly: [], foundation: [] } },
    { name: 'reader', dependencies: { components: ['qr-code'], typeOnly: [], foundation: [] } },
  ];
  write('registry/components.json', JSON.stringify({ components }));
  write(
    'registry/foundation.json',
    JSON.stringify({
      packages: [
        { name: '@apollo-design/theme', dir: 'theme', dependsOn: ['@apollo-design/utils'] },
        { name: '@apollo-design/utils', dir: 'utils', dependsOn: [] },
      ],
    }),
  );
  for (const name of [
    'ui/src/button',
    'ui/src/input',
    'ui/src/qr-code',
    'ui/src/reader',
    'theme/src',
    'utils/src',
  ]) {
    write(`packages/${name}/__tests__/core.test.ts`, 'test("existing core", () => {});');
    write(`packages/${name}/__tests__/type.test-d.ts`, 'test("existing public types", () => {});');
  }
  write('tests/tooling/example.test.mjs', '');
  return { root, write };
}

test('focused feedback defaults to core/types/format, rejects empty scopes and can add the affected layer', (t) => {
  const f = fixture(t);
  const plan = focusedPlan(f.root, ['packages/ui/src/button'], {
    projects: ['dom-contract', 'unit'],
  });
  assert.deepEqual(
    plan.checks.map((step) => step.kind),
    ['core', 'types', 'core', 'format'],
  );
  assert.equal(plan.checks.filter((step) => step.args.includes('unit')).length, 1);
  assert.equal(plan.checks.filter((step) => step.args.includes('dom-contract')).length, 1);
  assert.throws(() => focusedPlan(f.root, ['missing']), /No core regression/);
  assert.throws(() => focusedPlan(f.root, [], {}), /No source scope/);
});

test('actual shared production changes select consumers while workflow/PLAN/README do not queue component suites', (t) => {
  const f = fixture(t);
  const component = changedPlan(f.root, ['packages/ui/src/button/Button.vue']);
  assert.deepEqual(component.scope, ['packages/ui/src/button', 'packages/ui/src/input']);
  const shared = changedPlan(f.root, ['packages/utils/src/dom.ts']);
  assert.ok(shared.scope.includes('packages/theme/src'));
  assert.ok(shared.scope.includes('packages/ui/src/input'));
  const workflow = changedPlan(f.root, [
    'scripts/verify-component.mjs',
    'packages/ui/src/button/PLAN.md',
    'packages/ui/src/input/README.md',
    '.github/workflows/ci.yml',
  ]);
  assert.deepEqual(workflow.scope, []);
  assert.equal(workflow.checks.filter((step) => step.kind === 'core').length, 1);
  assert.equal(
    workflow.checks.some((step) => step.vitest || step.kind.startsWith('docs')),
    false,
  );
  const realJs = changedPlan(f.root, ['packages/ui/src/qr-code/engine/qrcodegen.js']);
  assert.deepEqual(realJs.scope, ['packages/ui/src/qr-code', 'packages/ui/src/reader']);
  const realData = changedPlan(f.root, ['packages/theme/src/palette.json']);
  assert.ok(realData.scope.includes('packages/ui/src/button'));
});

test('nonzero exits, missing executable, child signals and a green-looking stdout remain failures', (t) => {
  const { root } = fixture(t);
  for (const args of [
    ['-e', 'console.log("Tests 999 passed");process.exit(7)'],
    ['-e', 'process.kill(process.pid,"SIGTERM")'],
  ]) {
    const result = executePlan(
      {
        stage: 'architecture',
        scope: ['fixture'],
        checks: [{ kind: 'core', command: process.execPath, args }],
      },
      { root, quiet: true },
    );
    assert.equal(result.passed, false);
    assert.ok(result.checks[0].exitCode !== 0 || result.checks[0].signal);
  }
  const missing = executePlan(
    {
      stage: 'architecture',
      scope: [],
      checks: [{ kind: 'core', command: path.join(root, 'missing'), args: [] }],
    },
    { root, quiet: true },
  );
  assert.equal(missing.passed, false);
  assert.ok(missing.checks[0].error);
});

test('zero collected tests and empty plans cannot be recorded as passed', (t) => {
  const { root } = fixture(t);
  const output = path.join(root, 'checks.json');
  const result = executePlan(
    {
      stage: 'architecture',
      scope: ['fixture'],
      checks: [{ kind: 'core', command: 'fixture', args: [], vitest: true }],
    },
    {
      root,
      quiet: true,
      reportFile: output,
      execute(_command, args) {
        const file = args
          .find((arg) => arg.startsWith('--outputFile='))
          .slice('--outputFile='.length);
        fs.writeFileSync(
          file,
          JSON.stringify({ success: true, numPassedTests: 0, numFailedTests: 0 }),
        );
        return { status: 0, signal: null };
      },
    },
  );
  assert.equal(result.passed, false);
  assert.equal(JSON.parse(fs.readFileSync(output)).passed, false);
  assert.equal(
    executePlan({ stage: 'architecture', scope: [], checks: [] }, { root, quiet: true }).passed,
    false,
  );
});

test('dry runs execute nothing and never manufacture a successful report', (t) => {
  const { root } = fixture(t);
  const result = executePlan(fullPlan(), {
    root,
    dryRun: true,
    execute() {
      throw new Error('must not execute');
    },
  });
  assert.equal(result.dryRun, true);
  assert.equal(result.passed, false);
});

test('the final plan builds once, runs runtime through coverage once and preserves complete native visuals', () => {
  const plan = fullPlan();
  const build = plan.checks.filter((step) => step.kind === 'build');
  assert.equal(build.length, 1);
  assert.ok(build[0].args.includes('--strict'));
  assert.equal(plan.checks.filter((step) => step.kind === 'coverage').length, 1);
  assert.equal(
    plan.checks.some(
      (step) =>
        (step.args.length === 2 && step.args[0] === 'run' && step.args[1] === 'test') ||
        step.args.includes('build:docs'),
    ),
    false,
  );
  assert.equal(
    plan.checks.some((step) => step.args.includes('content:build')),
    false,
  );
  const visual = plan.checks.find((step) => step.kind === 'visual');
  assert.ok(visual.args.includes('tests/visual/apollo.mjs'));
  assert.equal(visual.args.includes('--approved-only'), false);
  assert.equal(docsPlan({ build: true }).checks.filter((step) => step.kind === 'build').length, 1);
  assert.equal(
    docsPlan({ build: true }).checks.some((step) => step.args.includes('content:build')),
    false,
  );
  assert.equal(
    docsPlan().checks.some((step) => step.kind === 'build'),
    false,
  );
});

test('source and published artifact drift are detected, without rewriting the frozen input', (t) => {
  const f = fixture(t);
  for (const args of [
    ['init', '-q'],
    ['config', 'user.email', 'fixture@example.invalid'],
    ['config', 'user.name', 'Fixture'],
    ['add', '.'],
    ['commit', '-qm', 'fixture'],
  ])
    assert.equal(spawnSync('git', args, { cwd: f.root }).status, 0);
  const sha = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: f.root,
    encoding: 'utf8',
  }).stdout.trim();
  assert.doesNotThrow(() => assertFrozenSource(f.root, sha));
  f.write('changed.txt', 'real change');
  assert.throws(() => assertFrozenSource(f.root, sha), /Source changed/);
  assert.throws(() => artifactDigest(f.root), /No published artifacts/);
  f.write('packages/ui/dist/index.mjs', 'export const fixture=1;');
  const first = artifactDigest(f.root);
  f.write('packages/ui/dist/index.mjs', 'export const fixture=2;');
  assert.notEqual(artifactDigest(f.root), first);
});

test('CI keeps PR feedback scoped and Docs browser checks on the single explicit build', () => {
  const root = path.resolve(import.meta.dirname, '../..');
  const require = createRequire(path.join(root, 'packages/docs/package.json'));
  const { parse } = require('yaml');
  const read = (name) => parse(fs.readFileSync(path.join(root, '.github/workflows', name), 'utf8'));
  const ci = read('ci.yml');
  assert.ok(ci.on.pull_request);
  assert.ok(ci.on.workflow_dispatch.inputs.stage.options.includes('acceptance'));
  const scoped = ci.jobs.architecture.steps.flatMap((step) => step.run ?? '').join('\n');
  assert.match(scoped, /verify-changed\.mjs/);
  assert.doesNotMatch(scoped, /verify-full\.mjs|test:coverage/);
  const docs = read('docs-ci.yml');
  assert.deepEqual(Object.keys(docs.on), ['workflow_dispatch']);
  const docsCommands = docs.jobs.docs.steps.flatMap((step) => step.run ?? '').join('\n');
  assert.equal((docsCommands.match(/verify-docs\.mjs --build/g) ?? []).length, 1);
  assert.doesNotMatch(docsCommands, /build:docs|content:build/);
  for (const check of [
    'smoke-browser.mjs',
    'stage2-demo-probe.mjs',
    'visual-v3/verify.mjs',
    'menu-browser.mjs',
    'notification-motion-browser.mjs',
    'motion-review-browser.mjs',
  ])
    assert.ok(
      fs.readFileSync(path.join(root, 'scripts/verify-docs-browser.mjs'), 'utf8').includes(check),
      `missing existing Docs browser check ${check}`,
    );
  assert.ok(docsCommands.includes('scripts/verify-docs-browser.mjs'));
  assert.ok(
    fullPlan().checks.some((step) => step.args.includes('scripts/verify-docs-browser.mjs')),
  );
  const deploy = read('deploy-docs.yml');
  const publishCommands = deploy.jobs.build.steps.flatMap((step) => step.run ?? '').join('\n');
  assert.equal((publishCommands.match(/verify-docs\.mjs --build/g) ?? []).length, 1);
  assert.doesNotMatch(publishCommands, /build:docs|content:build/);
});

test('Docs browser checks reuse one preview and always close it when a check fails', async () => {
  const { runDocsBrowser, DOCS_BROWSER_SCRIPTS } = await import(
    '../../scripts/verify-docs-browser.mjs'
  );
  let starts = 0,
    closes = 0;
  const executed = [];
  const start = async () => {
    starts++;
    return {
      resolvedUrls: { local: ['http://127.0.0.1:1234/apollo-design-ui/'] },
      httpServer: {
        close(done) {
          closes++;
          done();
        },
      },
    };
  };
  await runDocsBrowser({
    start,
    async run(script, base) {
      executed.push(script);
      assert.equal(base, 'http://127.0.0.1:1234/apollo-design-ui');
    },
  });
  assert.deepEqual(executed, DOCS_BROWSER_SCRIPTS);
  assert.equal(starts, 1);
  assert.equal(closes, 1);
  await assert.rejects(
    runDocsBrowser({
      start,
      async run() {
        throw new Error('actual browser failure');
      },
    }),
    /actual browser failure/,
  );
  assert.equal(starts, 2);
  assert.equal(closes, 2);
});

test('the standalone runtime entry keeps all four projects in a single Vitest invocation', () => {
  const root = path.resolve(import.meta.dirname, '../..');
  const scripts = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts;
  for (const project of ['unit', 'dom-contract', 'a11y', 'theme'])
    assert.ok(scripts.test.includes(`--project ${project}`));
  assert.equal((scripts.test.match(/vitest run/g) ?? []).length, 1);
  assert.doesNotMatch(scripts.test, /&&|passWithNoTests/);
});
