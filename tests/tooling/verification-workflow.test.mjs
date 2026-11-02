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

test('changes to dedicated test files run their project within the affected source scope', (t) => {
  const f = fixture(t);
  for (const [file, project] of [
    ['semantic.test.ts', 'dom-contract'],
    ['a11y.test.ts', 'a11y'],
    ['theme.test.ts', 'theme'],
  ]) {
    const plan = changedPlan(f.root, [`packages/ui/src/button/__tests__/${file}`]);
    const dedicated = plan.checks.filter((step) => step.args.includes(project));
    assert.equal(dedicated.length, 1, file);
    assert.ok(dedicated[0].args.includes('packages/ui/src/button'));
    assert.ok(dedicated[0].args.includes('packages/ui/src/input'));
    assert.equal(
      plan.checks.some((step) => step.kind === 'coverage'),
      false,
    );
  }
  const mixed = changedPlan(f.root, [
    'packages/ui/src/button/__tests__/a11y.test.ts',
    'packages/ui/src/input/__tests__/a11y.test.ts',
    'packages/ui/src/button/__tests__/semantic.test.ts',
  ]);
  for (const project of ['unit', 'types', 'dom-contract', 'a11y'])
    assert.equal(mixed.checks.filter((step) => step.args.includes(project)).length, 1);
  assert.equal(
    mixed.checks.some((step) => step.args.includes('theme')),
    false,
  );
});

test('acceptance infrastructure gets syntax/tooling feedback without defaulting to full build or visuals', (t) => {
  const f = fixture(t);
  for (const file of [
    'tests/build/checks/treeshake.mjs',
    'tests/consumer/run.mjs',
    'tests/visual/apollo.mjs',
    'tests/compat/runner/index.mjs',
  ]) {
    f.write(file, 'export const value = 1;');
    const plan = changedPlan(f.root, [file]);
    assert.ok(
      plan.checks.some((step) => step.kind === 'syntax' && step.args.includes(file)),
      file,
    );
    assert.ok(
      plan.checks.some((step) => step.args.includes('--test')),
      file,
    );
    assert.deepEqual(plan.scope, [], file);
    assert.equal(
      plan.checks.some((step) => ['build', 'coverage'].includes(step.kind)),
      false,
      file,
    );
    assert.equal(
      plan.checks.some((step) => step.kind === 'visual' && !step.args.includes('--check')),
      false,
      file,
    );
  }
  const plan = changedPlan(f.root, [
    'tests/build/budget.json',
    'tests/consumer/run.mjs',
    'tests/visual/matrix.mjs',
    'packages/docs/src/pages/Component.vue',
  ]);
  assert.equal(plan.checks.filter((step) => step.kind === 'build').length, 0);
  assert.ok(plan.checks.some((step) => step.args.includes('content:build')));
  const docs = changedPlan(f.root, [
    'README.md',
    'tests/build/README.md',
    'tests/consumer/README.md',
    'tests/visual/README.md',
    'tests/compat/README.md',
    'tests/browser/README.md',
  ]);
  assert.deepEqual(docs.checks, []);
  assert.deepEqual(changedPlan(f.root, ['assets/notes.svg']).checks, []);
});

test('resolver published checks select one existing build and consumer without entering source unit tests', (t) => {
  const f = fixture(t);
  const scripts = ['consumer', 'theme-matrix', 'published-contract'].map(
    (name) => `packages/ui-resolver/tests/${name}.mjs`,
  );
  for (const file of scripts) f.write(file, 'export const value = 1;');
  for (const files of [...scripts.map((file) => [file]), scripts]) {
    const plan = changedPlan(f.root, files);
    assert.deepEqual(plan.scope, []);
    assert.equal(plan.checks.filter((step) => step.kind === 'build').length, 1);
    const consumers = plan.checks.filter((step) => step.kind === 'consumer');
    assert.equal(consumers.length, 1);
    assert.deepEqual(consumers[0].args, ['packages/ui-resolver/tests/consumer.mjs', '--themes']);
    assert.ok(plan.checks.some((step) => step.args.includes('--test')));
    for (const file of files)
      assert.ok(plan.checks.some((step) => step.kind === 'syntax' && step.args.includes(file)));
  }
  assert.deepEqual(changedPlan(f.root, ['packages/ui-resolver/tests/README.md']).checks, []);
});

test('infrastructure syntax failures are real failures and changed visual/baseline data checks stay scoped', (t) => {
  const f = fixture(t);
  const bad = 'tests/build/checks/bad.mjs';
  f.write(bad, 'export const = ;');
  const plan = changedPlan(f.root, [bad]);
  const syntax = plan.checks.filter((step) => step.kind === 'syntax');
  assert.equal(syntax.length, 1);
  assert.equal(
    executePlan({ ...plan, checks: syntax }, { root: f.root, quiet: true }).passed,
    false,
  );
  const visual = changedPlan(f.root, ['tests/visual/baselines/apollo/button/basic-desktop.png']);
  const check = visual.checks.find((step) => step.kind === 'visual');
  assert.deepEqual(check.args, ['tests/visual/apollo.mjs', '--check', '--component', 'button']);
  assert.equal(
    visual.checks.some((step) => step.kind === 'build'),
    false,
  );
  const compat = changedPlan(f.root, ['tests/compat/baselines/button.dom.json']);
  assert.deepEqual(compat.checks.find((step) => step.kind === 'compat').args, [
    'tests/compat/runner/index.mjs',
    '--component',
    'button',
  ]);
});

test('browser checks select changed scripts and route the progress helper to its actual consumer', (t) => {
  const f = fixture(t);
  for (const file of [
    'tests/browser/button-docs.mjs',
    'tests/browser/audit-progress-check.mjs',
    'tests/browser/audit-batch-docs.mjs',
  ])
    f.write(file, '');
  const plan = changedPlan(f.root, [
    'tests/browser/button-docs.mjs',
    'tests/browser/audit-progress-check.mjs',
    'tests/browser/audit-batch-docs.mjs',
  ]);
  const browser = plan.checks.find((step) => step.kind === 'demo');
  assert.deepEqual(browser.args, [
    'scripts/verify-docs-browser.mjs',
    'tests/browser/button-docs.mjs',
    'tests/browser/audit-batch-docs.mjs',
  ]);
  assert.equal(plan.checks.filter((step) => step.kind === 'build').length, 1);
});

test('Docs browser changes and their shared tools select the affected real browser checks', (t) => {
  const f = fixture(t);
  const menu = 'packages/docs/tests/menu-browser.mjs';
  const motion = 'packages/docs/tests/motion-review-browser.mjs';
  for (const file of [menu, motion]) f.write(file, '');
  for (const [files, expected] of [
    [[menu], [menu]],
    [[motion], [motion]],
    [['tests/compat/motion-review/main.mjs'], [motion]],
    [['packages/docs/tests/motion-sampling.mjs'], [motion]],
    [
      [menu, motion, menu],
      [menu, motion],
    ],
  ]) {
    const plan = changedPlan(f.root, files);
    assert.deepEqual(plan.checks.find((step) => step.kind === 'demo')?.args, [
      'scripts/verify-docs-browser.mjs',
      ...expected,
    ]);
    assert.equal(plan.checks.filter((step) => step.kind === 'build').length, 1);
    assert.equal(
      plan.checks.some((step) => ['coverage', 'visual', 'compat'].includes(step.kind)),
      false,
    );
    assert.equal(
      plan.checks.some((step) => step.kind.startsWith('docs')),
      false,
    );
  }
  for (const file of [
    'scripts/verify-docs-browser.mjs',
    'tests/visual/stabilize.mjs',
    '.github/actions/browser/action.yml',
  ]) {
    const plan = changedPlan(f.root, [file]);
    const browser = plan.checks.find((step) => step.kind === 'demo');
    assert.equal(browser.args.length, 7);
    assert.ok(browser.args.includes(menu));
    assert.ok(browser.args.includes(motion));
  }
});

test('compat DOM baseline and generator changes select their actual Vue semantic consumers', (t) => {
  const f = fixture(t);
  const baseline = 'tests/compat/baselines/shared-action.dom.json';
  const consumer = (name) => `packages/ui/src/${name}/__tests__/semantic.test.ts`;
  for (const name of ['button', 'reader'])
    f.write(
      consumer(name),
      "import baseline from '../../../../../tests/compat/baselines/shared-action.dom.json';\nexport default baseline;",
    );
  f.write(
    consumer('input'),
    "// import baseline from '../../../../../tests/compat/baselines/shared-action.dom.json';\nexport default null;",
  );
  for (const file of [baseline, 'tests/compat/baseline/shared-action.mjs']) {
    const plan = changedPlan(f.root, [file]);
    const semantic = plan.checks.filter((step) => step.args.includes('dom-contract'));
    assert.equal(semantic.length, 1);
    assert.deepEqual(semantic[0].args.slice(4), [consumer('button'), consumer('reader')]);
    assert.deepEqual(plan.scope, []);
    assert.equal(
      plan.checks.some((step) => step.kind === 'build' || step.args.includes('unit')),
      false,
    );
  }
  const combined = changedPlan(f.root, [baseline, consumer('button')]);
  const semantic = combined.checks.filter((step) => step.args.includes('dom-contract'));
  assert.equal(semantic.length, 1);
  assert.ok(semantic[0].args.includes('packages/ui/src/button'));
  assert.ok(semantic[0].args.includes(consumer('reader')));
  assert.equal(semantic[0].args.includes(consumer('button')), false);
});

test('a changed standalone consumer fixture is executed, rather than only the tarball runner', (t) => {
  const f = fixture(t);
  const file = 'tests/consumer/button-ssr.mjs';
  f.write(file, 'throw new Error("changed consumer regression");');
  const plan = changedPlan(f.root, [file]);
  const consumer = plan.checks.find((step) => step.kind === 'consumer' && step.args.includes(file));
  assert.ok(consumer);
  const result = executePlan({ ...plan, checks: [consumer] }, { root: f.root, quiet: true });
  assert.equal(result.passed, false);
  assert.equal(result.checks[0].exitCode, 1);
  const multiple = changedPlan(f.root, [file, 'tests/browser/button-docs.mjs']);
  assert.equal(multiple.checks.filter((step) => step.kind === 'build').length, 1);
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
  for (const check of missing.checks) {
    assert.ok(Number.isFinite(Date.parse(check.finishedAt)));
    assert.ok(check.durationMs >= 0);
  }
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

test('reported checks persist live timing and preserve original Vitest results after failure', (t) => {
  const { root } = fixture(t);
  const output = path.join(root, 'checks.json');
  const messages = [];
  t.mock.method(console, 'log', (message) => messages.push(message));
  const originals = [];
  let executions = 0;
  const result = executePlan(
    {
      stage: 'acceptance',
      scope: ['fixture'],
      checks: [
        { kind: 'types', command: 'fixture', args: [], vitest: true },
        fullPlan().checks.find((step) => step.kind === 'coverage'),
        { kind: 'consumer', command: 'must-not-run', args: [] },
      ],
    },
    {
      root,
      reportFile: output,
      execute(_command, args, options) {
        const current = JSON.parse(fs.readFileSync(output, 'utf8'));
        assert.equal(current.passed, false);
        assert.equal(current.checks.length, executions + 1);
        const active = current.checks[executions];
        assert.ok(Number.isFinite(Date.parse(active.startedAt)));
        assert.equal(active.finishedAt, undefined);
        assert.equal(active.durationMs, undefined);
        assert.equal(active.exitCode, null);
        if (executions) {
          assert.ok(Number.isFinite(Date.parse(current.checks[0].finishedAt)));
          assert.ok(current.checks[0].durationMs >= 0);
          assert.equal(current.artifactDigest, 'unchanged-fixture');
          assert.deepEqual(args.slice(0, 2), ['run', 'test:coverage']);
        }
        assert.ok(args.includes('--reporter=default'));
        assert.ok(args.includes('--reporter=json'));
        assert.equal(options.stdio, 'inherit');
        const file = args
          .find((arg) => arg.startsWith('--outputFile='))
          .slice('--outputFile='.length);
        assert.equal(path.resolve(path.dirname(output), active.testReport), file);
        const tests = {
          success: executions === 0,
          numTotalTests: 3,
          numPassedTests: executions ? 2 : 3,
          numFailedTests: executions ? 1 : 0,
          numPendingTests: 0,
          testResults: [{ assertionResults: [{ failureMessages: ['original failure detail'] }] }],
        };
        const original = `${JSON.stringify(tests, null, 2)}\n`;
        originals.push({ file, original });
        fs.writeFileSync(file, original);
        return { status: executions++ === 0 ? 0 : 1, signal: null };
      },
      afterCheck(_step, report) {
        report.artifactDigest = 'unchanged-fixture';
      },
    },
  );
  assert.equal(result.passed, false);
  assert.equal(executions, 2);
  assert.equal(result.checks.length, 2);
  assert.equal(result.checks[1].exitCode, 1);
  assert.deepEqual(result.checks[1].tests, { total: 3, passed: 2, failed: 1, pending: 0 });
  assert.deepEqual(JSON.parse(fs.readFileSync(output, 'utf8')), result);
  for (const check of result.checks) {
    assert.ok(Date.parse(check.finishedAt) >= Date.parse(check.startedAt));
    assert.ok(Number.isInteger(check.durationMs) && check.durationMs >= 0);
  }
  for (const { file, original } of originals) assert.equal(fs.readFileSync(file, 'utf8'), original);
  assert.ok(messages.some((message) => message.includes('acceptance 2/3 coverage started:')));
  assert.ok(
    messages.some((message) => message.includes('acceptance 2/3 coverage finished: failed')),
  );
});

test('a reused report path cannot reuse old Vitest success or hide source diagnostics', (t) => {
  const { root } = fixture(t);
  const output = path.join(root, 'checks.json');
  const plan = {
    stage: 'architecture',
    scope: ['fixture'],
    checks: [{ kind: 'types', command: 'fixture', args: [], vitest: true }],
  };
  let firstReport;
  for (const outcome of ['passed', 'missing', 'source-errors']) {
    const result = executePlan(plan, {
      root,
      quiet: true,
      reportFile: output,
      execute(_command, args) {
        const file = args
          .find((arg) => arg.startsWith('--outputFile='))
          .slice('--outputFile='.length);
        if (outcome !== 'missing')
          fs.writeFileSync(
            file,
            JSON.stringify({ success: outcome === 'passed', numPassedTests: 3, numFailedTests: 0 }),
          );
        return { status: 0, signal: null };
      },
    });
    assert.equal(result.passed, outcome === 'passed');
    assert.equal(result.checks[0].exitCode, 0);
    if (outcome === 'passed') firstReport = result.checks[0].testReport;
    else {
      assert.notEqual(result.checks[0].testReport, firstReport);
      assert.ok(result.checks[0].error);
    }
    assert.equal(fs.existsSync(path.resolve(path.dirname(output), firstReport)), true);
  }
});

test('the coverage script entry forwards both reporters to an isolated Vitest fixture', (t) => {
  const f = fixture(t);
  const root = path.resolve(import.meta.dirname, '../..');
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(f.root, 'node_modules'), 'junction');
  f.write(
    'package.json',
    JSON.stringify({ private: true, scripts: { 'test:coverage': 'vitest run' } }),
  );
  f.write(
    'vitest.config.mjs',
    "export default { cacheDir: './.vite-cache', test: { include: ['probe.test.mjs'], environment: 'node', maxWorkers: 1 } };",
  );
  f.write(
    'probe.test.mjs',
    "import { expect, test } from 'vitest'; test('report fixture', () => expect(true).toBe(true));",
  );
  const output = path.join(f.root, 'checks.json');
  let stdout;
  const result = executePlan(
    {
      stage: 'fixture',
      scope: ['fixture'],
      checks: [fullPlan().checks.find((step) => step.kind === 'coverage')],
    },
    {
      root: f.root,
      quiet: true,
      reportFile: output,
      execute(command, args, options) {
        const child = spawnSync(command, args, options);
        stdout = child.stdout;
        return child;
      },
    },
  );
  assert.equal(result.passed, true);
  assert.equal(result.checks[0].tests.passed, 1);
  assert.match(stdout, /Test Files/);
  assert.match(stdout, /probe\.test\.mjs/);
  const original = JSON.parse(
    fs.readFileSync(path.resolve(path.dirname(output), result.checks[0].testReport), 'utf8'),
  );
  assert.equal(original.success, true);
  assert.equal(original.numPassedTests, 1);
});

test('dry runs execute nothing and never manufacture a successful report', (t) => {
  const { root } = fixture(t);
  const output = path.join(root, 'checks.json');
  const result = executePlan(fullPlan(), {
    root,
    dryRun: true,
    reportFile: output,
    execute() {
      throw new Error('must not execute');
    },
  });
  assert.equal(result.dryRun, true);
  assert.equal(result.passed, false);
  assert.equal(fs.existsSync(output), false);
  assert.equal(fs.existsSync(`${output}.evidence`), false);
});

test('the final plan builds once, runs runtime through coverage once and preserves complete native visuals', () => {
  const plan = fullPlan();
  assert.deepEqual(
    plan.checks.map((step) => step.kind),
    [
      'registry',
      'format',
      'build',
      'docs-browser',
      'coverage',
      'consumer-browser',
      'types',
      'types',
      'core',
      'consumer',
      'consumer',
      'visual',
      'docs-types',
      'docs-tests',
    ],
  );
  const build = plan.checks.filter((step) => step.kind === 'build');
  assert.equal(build.length, 1);
  assert.ok(build[0].args.includes('--strict'));
  const layering = plan.checks.find((step) => step.kind === 'consumer-browser');
  assert.deepEqual(layering.args, ['packages/ui/src/tooltip/__tests__/z-index-browser.mjs']);
  assert.ok(plan.checks.indexOf(layering) > plan.checks.indexOf(build[0]));
  const resolver = plan.checks.find((step) =>
    step.args.includes('packages/ui-resolver/tests/consumer.mjs'),
  );
  assert.equal(resolver.kind, 'consumer');
  assert.ok(resolver.args.includes('--themes'));
  assert.ok(plan.checks.indexOf(resolver) > plan.checks.indexOf(build[0]));
  assert.equal(plan.checks.filter((step) => step.kind === 'coverage').length, 1);
  const coverage = plan.checks.find((step) => step.kind === 'coverage');
  const browser = plan.checks.find((step) => step.kind === 'docs-browser');
  assert.equal(plan.checks.indexOf(browser), plan.checks.indexOf(build[0]) + 1);
  assert.equal(plan.checks.indexOf(coverage), plan.checks.indexOf(browser) + 1);
  assert.deepEqual(coverage.args, ['run', 'test:coverage']);
  assert.equal(coverage.vitest, true);
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
  assert.deepEqual(visual.args, ['tests/visual/parallel.mjs']);
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

test('CI keeps scoped native preflight and aggregates independent readers of the single frozen build', () => {
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
  assert.equal(ci.jobs.architecture['runs-on'], 'ubuntu-24.04');
  assert.ok(ci.jobs.architecture.steps.some((step) => step.uses === './.github/actions/browser'));
  const build = ci.jobs.acceptance_build.steps.filter((step) =>
    step.run?.includes('verify-full.mjs'),
  );
  assert.equal(build.length, 1);
  assert.match(build[0].run, /--layer build/);
  const readers = ci.jobs.acceptance_checks;
  assert.equal(readers.needs, 'acceptance_build');
  assert.equal(
    readers['runs-on'],
    '$' + "{{ matrix.layer == 'docs' && 'ubuntu-24.04' || 'macos-15-intel' }}",
  );
  assert.deepEqual(readers.strategy.matrix.layer, [
    'docs',
    'runtime',
    'types',
    'consumers',
    'visual',
  ]);
  assert.equal(readers.strategy['fail-fast'], false);
  assert.equal(readers.strategy['max-parallel'], 5);
  const layer = readers.steps.find((step) => step.run?.includes('verify-full.mjs'));
  assert.equal(layer.env.TMPDIR, '$' + '{{ runner.temp }}');
  assert.match(layer.run, /--layer/);
  assert.match(layer.run, /--inputs/);
  assert.doesNotMatch(
    readers.steps.flatMap((step) => step.run ?? '').join('\n'),
    /pnpm.*build|tests\/build\/run/,
  );
  const browser = parse(
    fs.readFileSync(path.join(root, '.github/actions/browser/action.yml'), 'utf8'),
  );
  const chrome = browser.runs.steps.find((step) => step.id === 'chrome');
  const baseline = JSON.parse(
    fs.readFileSync(path.join(root, 'tests/visual/baselines/apollo/manifest.json'), 'utf8'),
  );
  assert.deepEqual(
    [...new Set(Object.values(baseline.entries).map((entry) => entry.environment.split('/')[2]))],
    [chrome.env.APOLLO_BASELINE_CHROME_VERSION],
  );
  assert.match(chrome.run, /APOLLO_CHROME_EXECUTABLE/);
  assert.deepEqual(ci.jobs.acceptance.needs, [
    'acceptance_source',
    'acceptance_build',
    'acceptance_checks',
  ]);
  assert.match(ci.jobs.acceptance.if, /always\(\)/);
  const sourceResult = ci.jobs.acceptance.steps.find((step) => step.env?.SOURCE_RESULT);
  assert.equal(sourceResult.env.SOURCE_RESULT, '$' + '{{ needs.acceptance_source.result }}');
  assert.match(sourceResult.run, /test "\$SOURCE_RESULT" = success/);
  const aggregate = ci.jobs.acceptance.steps.find((step) => step.run?.includes('verify-full.mjs'));
  assert.match(aggregate.run, /--aggregate/);
  assert.ok(aggregate.env.ACCEPTANCE_JOB_RESULTS);
  const resultUpload = ci.jobs.acceptance.steps.find((step) => step.id === 'acceptance_artifacts');
  assert.equal(resultUpload['continue-on-error'], true);
  assert.ok(resultUpload.with.path.includes('/tmp/final-acceptance.json'));
  const recovery = ci.jobs.acceptance.steps.find(
    (step) => step.with?.name === 'final-acceptance-upload-retry-1',
  );
  assert.equal(
    recovery.if,
    '$' + "{{ always() && steps.acceptance_artifacts.outcome == 'failure' }}",
  );
  assert.equal(recovery['continue-on-error'], undefined);
  assert.equal(recovery.with['if-no-files-found'], 'error');
  const layerUpload = readers.steps.find((step) => step.id === 'layer_report');
  assert.ok(layerUpload.with.path.includes('.json.evidence/'));
  const focusedUpload = ci.jobs.architecture.steps.find(
    (step) => step.with?.name === 'architecture-checks',
  );
  assert.ok(focusedUpload.with.path.includes('/tmp/architecture-checks.json.evidence/'));
  assert.ok(focusedUpload.with.path.includes('apollo-docs-browser-'));
  const docs = read('docs-ci.yml');
  assert.deepEqual(Object.keys(docs.on), ['workflow_dispatch']);
  const docsCommands = docs.jobs.docs.steps.flatMap((step) => step.run ?? '').join('\n');
  assert.equal((docsCommands.match(/verify-docs\.mjs --build/g) ?? []).length, 1);
  assert.doesNotMatch(docsCommands, /build:docs|content:build/);
  assert.equal(docs.jobs.docs['runs-on'], 'ubuntu-24.04');
  assert.ok(docs.jobs.docs.steps.some((step) => step.uses === './.github/actions/browser'));
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
  executed.length = 0;
  await runDocsBrowser({
    scripts: ['tests/browser/button-docs.mjs'],
    start,
    async run(script) {
      executed.push(script);
    },
  });
  assert.deepEqual(executed, ['tests/browser/button-docs.mjs']);
  executed.length = 0;
  await assert.rejects(
    runDocsBrowser({
      start,
      async run(script) {
        executed.push(script);
        if (script === DOCS_BROWSER_SCRIPTS[0] || script === DOCS_BROWSER_SCRIPTS.at(-1))
          throw new Error(`actual browser failure: ${script}`);
      },
    }),
    (error) => {
      assert.ok(error instanceof AggregateError);
      assert.equal(error.errors.length, 2);
      assert.equal(error.report.passed, false);
      assert.equal(error.report.checks.filter((check) => check.status === 'failed').length, 2);
      assert.equal(
        error.report.checks.some((check) => ['running', 'not_run'].includes(check.status)),
        false,
      );
      assert.match(error.message, /actual browser failure/);
      return true;
    },
  );
  assert.deepEqual(executed, DOCS_BROWSER_SCRIPTS);
  assert.equal(starts, 3);
  assert.equal(closes, 3);
});

test('the default Docs browser runner isolates real child evidence and retains it on failure', async (t) => {
  const { runDocsBrowser } = await import('../../scripts/verify-docs-browser.mjs');
  const f = fixture(t);
  const root = path.resolve(import.meta.dirname, '../..');
  const evidence = [
    'docs/audit/evidence/stage2-demo.json',
    'docs/audit/evidence/review-002-motion.json',
  ];
  const originalEvidence = evidence.map((file) =>
    fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file)) : null,
  );
  const outputRoots = new Set();
  let starts = 0,
    closes = 0;
  t.after(() => {
    for (const outputRoot of outputRoots) fs.rmSync(outputRoot, { recursive: true, force: true });
  });
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
  const script = (name, exitCode) => {
    const capture = path.join(f.root, `${name}.json`);
    f.write(
      `${name}.mjs`,
      `import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = ${JSON.stringify(root)};
assert.notEqual(fs.realpathSync(process.cwd()), fs.realpathSync(root), 'Evidence must not be written into frozen source');
for (const entry of ['node_modules', 'packages', 'tests'])
  assert.equal(fs.realpathSync(entry), fs.realpathSync(path.join(root, entry)));
const result = { outputRoot: process.cwd(), base: process.env.DOCS_URL };
fs.writeFileSync(${JSON.stringify(capture)}, JSON.stringify(result));
fs.mkdirSync('docs/audit/evidence', { recursive: true });
for (const file of ${JSON.stringify(evidence)}) fs.writeFileSync(file, JSON.stringify(result));
process.exitCode = ${exitCode};
`,
    );
    return { file: path.join(f.root, `${name}.mjs`), capture };
  };

  const success = script('success', 0);
  const result = await runDocsBrowser({
    start,
    scripts: [path.relative(root, success.file)],
  });
  const successOutput = JSON.parse(fs.readFileSync(success.capture, 'utf8'));
  outputRoots.add(successOutput.outputRoot);
  assert.equal(fs.realpathSync(result.outputRoot), successOutput.outputRoot);
  assert.equal(successOutput.base, 'http://127.0.0.1:1234/apollo-design-ui');
  for (const file of evidence)
    assert.deepEqual(
      JSON.parse(fs.readFileSync(path.join(result.outputRoot, file), 'utf8')),
      successOutput,
    );

  const failure = script('failure', 23);
  const following = script('runs-after-failure', 0);
  await assert.rejects(
    runDocsBrowser({ start, scripts: [failure.file, following.file] }),
    /exit 23/,
  );
  const failedOutput = JSON.parse(fs.readFileSync(failure.capture, 'utf8'));
  outputRoots.add(failedOutput.outputRoot);
  assert.notEqual(failedOutput.outputRoot, successOutput.outputRoot);
  assert.equal(fs.existsSync(following.capture), true);
  const failedReport = JSON.parse(
    fs.readFileSync(
      path.join(failedOutput.outputRoot, 'docs/audit/evidence/browser-checks.json'),
      'utf8',
    ),
  );
  assert.equal(failedReport.passed, false);
  assert.deepEqual(
    failedReport.checks.map((check) => check.status),
    ['failed', 'passed'],
  );
  assert.equal(failedReport.checks[0].exitCode, 23);
  assert.ok(failedReport.checks.every((check) => check.durationMs >= 0));
  for (const file of evidence)
    assert.deepEqual(
      JSON.parse(fs.readFileSync(path.join(failedOutput.outputRoot, file), 'utf8')),
      failedOutput,
    );
  assert.deepEqual(
    evidence.map((file) =>
      fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file)) : null,
    ),
    originalEvidence,
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
