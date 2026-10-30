/** Small verification plans shared by the existing command entries. */
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '..');
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const node = (kind, args, extra = {}) => ({ kind, command: process.execPath, args, ...extra });
const packageRun = (kind, script) => ({ kind, command: pnpm, args: ['run', script] });
export const docsRun = (kind, script) => ({
  kind,
  command: pnpm,
  args: ['--filter', '@apollo-design/docs', 'run', script],
});
const codeFile = /\.(?:[cm]?[jt]sx?|vue|json|css)$/;
function filesUnder(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(file) : [file];
  });
}
export function focusedPlan(root, scopes, { projects = [], demoScripts = [] } = {}) {
  const selected = [...new Set(scopes)];
  if (!selected.length) throw new Error('No source scope selected');
  const allFiles = selected.flatMap((scope) => filesUnder(path.join(root, scope)));
  const coreFiles = allFiles.filter(
    (file) =>
      /\.test\.tsx?$/.test(file) && !/(?:a11y|semantic|theme)\.test\.ts$|\.test-d\.ts$/.test(file),
  );
  if (!coreFiles.length) throw new Error('No core regression tests in the selected scope');
  const typeFiles = allFiles.filter((file) => /\.test-d\.ts$/.test(file));
  const requested = [...new Set(projects)];
  for (const project of requested)
    if (!['unit', 'types', 'dom-contract', 'a11y', 'theme'].includes(project))
      throw new Error(`Unknown project: ${project}`);
  const checks = [
    node('core', ['node_modules/vitest/vitest.mjs', 'run', '--project', 'unit', ...selected], {
      vitest: true,
    }),
  ];
  if (typeFiles.length)
    checks.push(
      node('types', ['node_modules/vitest/vitest.mjs', 'run', '--project', 'types', ...selected], {
        vitest: true,
      }),
    );
  else
    checks.push(
      node('types', ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit', '-p', 'tsconfig.json']),
    );
  for (const project of requested.filter((name) => !['unit', 'types'].includes(name)))
    checks.push(
      node('core', ['node_modules/vitest/vitest.mjs', 'run', '--project', project, ...selected], {
        vitest: true,
      }),
    );
  checks.push(node('format', ['node_modules/@biomejs/biome/bin/biome', 'check', ...selected]));
  for (const file of demoScripts) {
    if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing demo check: ${file}`);
    checks.push(node('demo', [file]));
  }
  return { stage: 'architecture', scope: selected, checks };
}
export function changedFiles(root, base) {
  const run = (args) => {
    const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || 'Could not inspect changed files');
    return result.stdout.split('\0').filter(Boolean);
  };
  return [
    ...new Set([
      ...run(['diff', '--name-only', '-z', base ?? 'HEAD', '--']),
      ...run(['ls-files', '--others', '--exclude-standard', '-z']),
    ]),
  ];
}
export function changedPlan(root, files) {
  const components = JSON.parse(
    fs.readFileSync(path.join(root, 'registry/components.json'), 'utf8'),
  ).components;
  const foundation = JSON.parse(
    fs.readFileSync(path.join(root, 'registry/foundation.json'), 'utf8'),
  ).packages;
  const selected = new Set(),
    packages = new Set(),
    projects = new Set(),
    acceptanceLayers = new Set();
  let workflow = false,
    docs = false,
    globalTypes = false;
  for (const file of files) {
    const layer = file.match(/^tests\/(build|consumer|visual|compat|browser)\//)?.[1];
    if (layer && !/\.(?:md|txt)$/.test(file)) {
      acceptanceLayers.add(layer);
      workflow = true;
    }
    if (/^(scripts\/|registry\/|tests\/tooling\/|\.github\/|(?:package|biome)\.json$)/.test(file))
      workflow = true;
    if (
      /^packages\/docs\/|^packages\/ui\/src\/[^/]+\/(?:index\.[^/]+\.md|demo\/.*\.(?:md|vue))$/.test(
        file,
      )
    )
      docs = true;
    if (/^tsconfig.*\.json$/.test(file)) globalTypes = true;
    if (/^(?:vitest\.config\.ts|vitest\.setup\.ts|pnpm-lock\.yaml)$/.test(file))
      for (const row of components) selected.add(row.name);
    if (!codeFile.test(file)) continue;
    const project = {
      'semantic.test.ts': 'dom-contract',
      'a11y.test.ts': 'a11y',
      'theme.test.ts': 'theme',
    }[path.basename(file)];
    if (project && /^packages\/[^/]+\/src\//.test(file)) projects.add(project);
    const ui = file.match(/^packages\/ui\/src\/([^/]+)(?:\/|$)/);
    if (ui) {
      if (components.some((row) => row.name === ui[1])) selected.add(ui[1]);
      else for (const row of components) selected.add(row.name);
    }
    const pkg = file.match(/^packages\/([^/]+)\/src\//);
    if (pkg && !['ui', 'docs'].includes(pkg[1])) packages.add(`@apollo-design/${pkg[1]}`);
  }
  let previous;
  do {
    previous = selected.size + packages.size;
    for (const row of foundation)
      if (row.dependsOn?.some((name) => packages.has(name))) packages.add(row.name);
    for (const row of components)
      if (
        [...row.dependencies.components, ...row.dependencies.typeOnly].some((name) =>
          selected.has(name),
        ) ||
        row.dependencies.foundation.some((name) => packages.has(name))
      )
        selected.add(row.name);
  } while (previous !== selected.size + packages.size);
  const scopes = [...selected].sort().map((name) => `packages/ui/src/${name}`);
  for (const name of [...packages].sort())
    scopes.push(`packages/${name.replace('@apollo-design/', '')}/src`);
  const checks = scopes.length ? focusedPlan(root, scopes, { projects: [...projects] }).checks : [];
  if (workflow) {
    const tests = filesUnder(path.join(root, 'tests/tooling'))
      .filter((file) => file.endsWith('.test.mjs'))
      .map((file) => path.relative(root, file));
    if (!tests.length) throw new Error('No workflow regression tests found');
    checks.push(node('core', ['--test', ...tests]));
    const scripts = files.filter(
      (file) => /\.[cm]?js$/.test(file) && fs.existsSync(path.join(root, file)),
    );
    if (scripts.length)
      checks.push(node('format', ['node_modules/@biomejs/biome/bin/biome', 'check', ...scripts]));
  }
  if (globalTypes && !checks.some((check) => check.kind === 'types'))
    checks.push(
      node('types', ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit', '-p', 'tsconfig.json']),
    );
  for (const file of [...new Set(files)].filter(
    (file) =>
      /^tests\/(build|consumer|visual|compat|browser)\//.test(file) &&
      fs.existsSync(path.join(root, file)),
  )) {
    if (/\.[cm]?js$/.test(file)) checks.push(node('syntax', ['--check', file]));
    else if (file.endsWith('.json'))
      checks.push(
        node('syntax', [
          '--input-type=module',
          '-e',
          'import fs from "node:fs"; JSON.parse(fs.readFileSync(process.argv[1], "utf8"));',
          file,
        ]),
      );
  }
  const consumerFixtures = [...new Set(files)].filter(
    (file) =>
      /^tests\/consumer\/[^/]+\.mjs$/.test(file) &&
      file !== 'tests/consumer/run.mjs' &&
      fs.existsSync(path.join(root, file)),
  );
  const build = consumerFixtures.length > 0 || acceptanceLayers.has('browser');
  if (build) checks.push(node('build', ['tests/build/run.mjs', '--strict']));
  for (const file of consumerFixtures) checks.push(node('consumer', [file]));
  const visualComponents = [
    ...new Set(
      files.flatMap((file) => {
        const match = file.match(/^tests\/visual\/baselines\/apollo\/([^/]+)\//);
        return match ? [match[1]] : [];
      }),
    ),
  ];
  if (visualComponents.length)
    checks.push(
      node('visual', [
        'tests/visual/apollo.mjs',
        '--check',
        ...visualComponents.flatMap((component) => ['--component', component]),
      ]),
    );
  else if (files.some((file) => /^tests\/visual\/baselines\/apollo\/[^/]+\.json$/.test(file))) {
    // Phase-one metadata integrity is scoped to reviewed entries; final visuals still run all cases.
    checks.push(node('visual', ['tests/visual/apollo.mjs', '--check', '--approved-only']));
  }
  if (acceptanceLayers.has('compat')) {
    const components = files
      .filter((file) => /^tests\/compat\//.test(file) && !/\.(?:md|txt)$/.test(file))
      .map((file) => {
        const match = file.match(
          /^tests\/compat\/(?:baseline\/([^/]+)\.mjs|baselines\/([^/]+)\.dom\.json)$/,
        );
        return match?.[1] ?? match?.[2] ?? null;
      });
    if (components.includes(null)) checks.push(node('compat', ['tests/compat/runner/index.mjs']));
    else
      for (const component of new Set(components))
        checks.push(node('compat', ['tests/compat/runner/index.mjs', '--component', component]));
  }
  if (acceptanceLayers.has('browser')) {
    const scripts = [...new Set(files)].filter(
      (file) => /^tests\/browser\/.*\.mjs$/.test(file) && fs.existsSync(path.join(root, file)),
    );
    checks.push(
      node('demo', [
        'scripts/verify-docs-browser.mjs',
        ...new Set(
          scripts.map((file) =>
            file === 'tests/browser/audit-progress-check.mjs'
              ? 'tests/browser/audit-batch-docs.mjs'
              : file,
          ),
        ),
      ]),
    );
  }
  if (docs)
    checks.push(
      ...(!build ? [docsRun('docs-content', 'content:build')] : []),
      docsRun('docs-types', 'typecheck'),
      docsRun('docs-tests', 'test'),
    );
  return { stage: 'architecture', scope: scopes, changedFiles: files, checks };
}
export function docsPlan({ build = false } = {}) {
  return {
    stage: 'docs',
    scope: ['packages/docs'],
    checks: [
      ...(build
        ? [node('build', ['tests/build/run.mjs', '--strict'])]
        : [docsRun('docs-content', 'content:build')]),
      docsRun('docs-types', 'typecheck'),
      docsRun('docs-tests', 'test'),
    ],
  };
}
export function fullPlan() {
  return {
    stage: 'acceptance',
    scope: ['packages'],
    checks: [
      packageRun('registry', 'registry:check'),
      packageRun('format', 'lint:format'),
      // The single build also generates Docs content; all checks below reuse it.
      node('build', ['tests/build/run.mjs', '--strict']),
      node('types', ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit', '-p', 'tsconfig.json'], {
        env: { NODE_OPTIONS: '--max-old-space-size=4096' },
      }),
      node('types', ['node_modules/vitest/vitest.mjs', 'run', '--project', 'types'], {
        vitest: true,
        env: { NODE_OPTIONS: '--max-old-space-size=4096' },
      }),
      packageRun('core', 'test:tooling'),
      packageRun('coverage', 'test:coverage'),
      // These consumers build only their isolated fixture, never packages/*/dist.
      node('consumer', ['tests/consumer/run.mjs']),
      node('visual', ['tests/visual/apollo.mjs']),
      docsRun('docs-types', 'typecheck'),
      docsRun('docs-tests', 'test'),
      node('docs-browser', ['scripts/verify-docs-browser.mjs']),
    ],
  };
}
export function assertFrozenSource(root, sourceCommit) {
  const sha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  const status = spawnSync('git', ['status', '--porcelain', '--untracked-files=normal'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (
    sha.status !== 0 ||
    status.status !== 0 ||
    sha.stdout.trim() !== sourceCommit ||
    status.stdout.trim()
  )
    throw new Error(
      'Source changed or worktree is not clean; freeze one commit before final acceptance',
    );
}
export function artifactDigest(root) {
  const hash = crypto.createHash('sha256');
  let count = 0;
  for (const pkg of fs.readdirSync(path.join(root, 'packages')).sort()) {
    for (const file of filesUnder(path.join(root, 'packages', pkg, 'dist')).sort()) {
      hash.update(path.relative(root, file));
      hash.update(fs.readFileSync(file));
      count++;
    }
  }
  if (!count) throw new Error('No published artifacts found');
  return hash.digest('hex');
}
export function executePlan(
  plan,
  { root = ROOT, quiet = false, dryRun = false, reportFile, execute = spawnSync, afterCheck } = {},
) {
  if (dryRun) {
    console.log(JSON.stringify({ ...plan, dryRun: true, passed: false }, null, 2));
    return { ...plan, dryRun: true, passed: false };
  }
  const report = {
    stage: plan.stage,
    scope: plan.scope,
    checks: [],
    passed: false,
    ...(plan.sourceCommit ? { sourceCommit: plan.sourceCommit } : {}),
  };
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-focused-check-'));
  try {
    if (!plan.checks.length) throw new Error('No checks selected; nothing was verified');
    for (const step of plan.checks) {
      const testReport = path.join(temporary, `${report.checks.length}.json`);
      const args = step.vitest
        ? [...step.args, '--reporter=json', `--outputFile=${testReport}`]
        : step.args;
      const result = execute(step.command, args, {
        cwd: root,
        env: { ...process.env, ...step.env },
        encoding: 'utf8',
        stdio: quiet ? 'pipe' : 'inherit',
        maxBuffer: 16 * 1024 * 1024,
        shell: process.platform === 'win32',
      });
      const check = {
        kind: step.kind,
        command: [step.command, ...step.args].join(' '),
        exitCode: result.status ?? null,
        signal: result.signal ?? null,
      };
      if (result.error) check.error = result.error.message;
      if (step.vitest && result.status === 0) {
        if (!fs.existsSync(testReport)) check.error = 'Vitest did not produce a result report';
        else {
          const tests = JSON.parse(fs.readFileSync(testReport, 'utf8'));
          if (!(tests.numPassedTests > 0) || tests.numFailedTests > 0 || tests.success === false)
            check.error = 'No passing tests, failed tests or source diagnostics in Vitest report';
        }
      }
      report.checks.push(check);
      if (check.exitCode !== 0 || check.signal || check.error) {
        if (quiet) process.stderr.write((result.stdout ?? '') + (result.stderr ?? ''));
        throw new Error(
          `${step.kind} failed (${check.signal ?? check.exitCode}): ${check.error ?? check.command}`,
        );
      }
      afterCheck?.(step, report);
    }
    report.passed = true;
    console.log(
      `[verification] ${plan.stage}: ${report.checks.length} checks passed; scope=${plan.scope.join(', ') || 'workflow/docs'}`,
    );
  } catch (error) {
    report.error = error.message;
    console.error(`[verification] ${error.message}`);
  } finally {
    if (reportFile)
      fs.writeFileSync(path.resolve(root, reportFile), `${JSON.stringify(report, null, 2)}\n`);
    fs.rmSync(temporary, { recursive: true, force: true });
  }
  return report;
}
