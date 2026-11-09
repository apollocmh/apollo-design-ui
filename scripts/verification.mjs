/** Small verification plans shared by the existing command entries. */
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';
import { docsBrowserScriptsForFiles } from './verify-docs-browser.mjs';

export const ROOT = path.resolve(import.meta.dirname, '..');
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const node = (kind, args, extra = {}) => ({ kind, command: process.execPath, args, ...extra });
const packageRun = (kind, script, extra = {}) => ({
  kind,
  command: pnpm,
  args: ['run', script],
  ...extra,
});
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
  const resolverConsumerChanged = files.some((file) =>
    /^packages\/ui-resolver\/tests\/[^/]+\.mjs$/.test(file),
  );
  const docsBrowserScripts = docsBrowserScriptsForFiles(files);
  const mcpChanged = files.some(
    (file) =>
      file.startsWith('packages/mcp/') ||
      /^packages\/docs\/tooling\/content\/(ai-content|build-manifest|demo-source)\.mjs$/.test(file),
  );
  let workflow = resolverConsumerChanged || docsBrowserScripts.length > 0,
    docs = false,
    globalTypes = false;
  for (const file of files) {
    const layer = file.match(/^tests\/(build|consumer|visual|compat|browser)\//)?.[1];
    if (layer && !/\.(?:md|txt)$/.test(file) && !file.startsWith('tests/compat/motion-review/')) {
      acceptanceLayers.add(layer);
      workflow = true;
    }
    if (/^(scripts\/|registry\/|tests\/tooling\/|\.github\/|(?:package|biome)\.json$)/.test(file))
      workflow = true;
    if (
      /^packages\/docs\/|^packages\/ui\/src\/[^/]+\/(?:index\.[^/]+\.md|demo\/.*\.(?:md|vue))$/.test(
        file,
      ) &&
      !docsBrowserScripts.includes(file) &&
      file !== 'packages/docs/tests/motion-sampling.mjs'
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
    if (pkg && !['ui', 'docs', 'mcp'].includes(pkg[1])) packages.add(`@apollo-design/${pkg[1]}`);
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
  if (mcpChanged) {
    checks.push(
      node('types', [
        'node_modules/typescript/bin/tsc',
        '--noEmit',
        '-p',
        'packages/mcp/tsconfig.json',
      ]),
    );
    checks.push({
      kind: 'build',
      command: pnpm,
      args: ['--filter', '@apollo-design/mcp', 'run', 'build'],
    });
    checks.push(node('consumer', ['--test', 'packages/mcp/tests/consumer.mjs']));
    checks.push(node('format', ['node_modules/@biomejs/biome/bin/biome', 'check', 'packages/mcp']));
  }
  const changedBaselines = new Set(
    files.flatMap((file) => {
      const generator = file.match(/^tests\/compat\/baseline\/([^/]+)\.mjs$/);
      return generator
        ? [path.resolve(root, `tests/compat/baselines/${generator[1]}.dom.json`)]
        : /^tests\/compat\/baselines\/[^/]+\.dom\.json$/.test(file)
          ? [path.resolve(root, file)]
          : [];
    }),
  );
  if (changedBaselines.size) {
    const sourceRoots = ['packages/ui/src', ...foundation.map((row) => `packages/${row.dir}/src`)];
    const consumers = sourceRoots
      .flatMap((scope) => filesUnder(path.join(root, scope)))
      .filter((file) => file.endsWith('/__tests__/semantic.test.ts'))
      .filter((file) => {
        const source = ts.createSourceFile(
          file,
          fs.readFileSync(file, 'utf8'),
          ts.ScriptTarget.Latest,
        );
        return source.statements.some(
          (statement) =>
            ts.isImportDeclaration(statement) &&
            ts.isStringLiteral(statement.moduleSpecifier) &&
            changedBaselines.has(path.resolve(path.dirname(file), statement.moduleSpecifier.text)),
        );
      })
      .map((file) => path.relative(root, file))
      .sort();
    const existing = checks.find((step) => step.vitest && step.args.includes('dom-contract'));
    const missing = consumers.filter(
      (file) => !existing?.args.some((scope) => file === scope || file.startsWith(`${scope}/`)),
    );
    if (missing.length) {
      if (existing) existing.args.push(...missing);
      else
        checks.push(
          node(
            'core',
            ['node_modules/vitest/vitest.mjs', 'run', '--project', 'dom-contract', ...missing],
            { vitest: true },
          ),
        );
    }
  }
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
      (/^tests\/(build|consumer|visual|compat|browser)\//.test(file) ||
        /^packages\/ui-resolver\/tests\/[^/]+\.mjs$/.test(file)) &&
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
  const build =
    consumerFixtures.length > 0 ||
    acceptanceLayers.has('browser') ||
    docsBrowserScripts.length > 0 ||
    resolverConsumerChanged;
  if (build) checks.push(node('build', ['tests/build/run.mjs', '--strict']));
  if (resolverConsumerChanged)
    checks.push(node('consumer', ['packages/ui-resolver/tests/consumer.mjs', '--themes']));
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
  if (acceptanceLayers.has('browser') || docsBrowserScripts.length) {
    const scripts = [...new Set(files)].filter(
      (file) => /^tests\/browser\/.*\.mjs$/.test(file) && fs.existsSync(path.join(root, file)),
    );
    checks.push(
      node('demo', [
        'scripts/verify-docs-browser.mjs',
        ...new Set([
          ...docsBrowserScripts,
          ...scripts.map((file) =>
            file === 'tests/browser/audit-progress-check.mjs'
              ? 'tests/browser/audit-batch-docs.mjs'
              : file,
          ),
        ]),
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
      // Browser failures must surface before coverage and the complete pixel matrix.
      node('docs-browser', ['scripts/verify-docs-browser.mjs']),
      // Earlier runtime failures avoid waiting for unrelated checks; passing runs do the same work.
      packageRun('coverage', 'test:coverage', { vitest: true }),
      node('consumer-browser', ['packages/ui/src/tooltip/__tests__/z-index-browser.mjs']),
      node('types', ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit', '-p', 'tsconfig.json'], {
        env: { NODE_OPTIONS: '--max-old-space-size=4096' },
      }),
      node('types', ['node_modules/vitest/vitest.mjs', 'run', '--project', 'types'], {
        vitest: true,
        env: { NODE_OPTIONS: '--max-old-space-size=4096' },
      }),
      packageRun('core', 'test:tooling'),
      // These consumers build only their isolated fixture, never packages/*/dist.
      node('consumer', ['tests/consumer/run.mjs']),
      node('consumer', ['packages/ui-resolver/tests/consumer.mjs', '--themes']),
      node('visual', ['tests/visual/parallel.mjs']),
      docsRun('docs-types', 'typecheck'),
      docsRun('docs-tests', 'test'),
    ].map((check, index) => ({ ...check, id: `${index}-${check.kind}` })),
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
    startedAt: new Date().toISOString(),
    ciRunAttempt: Number(process.env.GITHUB_RUN_ATTEMPT ?? '1'),
    host: {
      platform: process.platform,
      arch: process.arch,
      logicalCpuCount: os.cpus().length,
      totalMemory: os.totalmem(),
      loadAverage: os.loadavg(),
    },
    ...(plan.layer ? { layer: plan.layer } : {}),
    ...(plan.provenance ? { provenance: plan.provenance } : {}),
    ...(plan.changes ? { changes: plan.changes } : {}),
    ...(plan.sourceCommit ? { sourceCommit: plan.sourceCommit } : {}),
  };
  const reportPath = reportFile ? path.resolve(root, reportFile) : null;
  const evidenceRoot = reportPath ? `${reportPath}.evidence` : os.tmpdir();
  if (reportPath) fs.mkdirSync(evidenceRoot, { recursive: true });
  const temporary = fs.mkdtempSync(path.join(evidenceRoot, 'apollo-focused-check-'));
  const saveReport = () => {
    if (reportPath) fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  };
  try {
    saveReport();
    if (!plan.checks.length) throw new Error('No checks selected; nothing was verified');
    for (const step of plan.checks) {
      const testReport = path.join(temporary, `${report.checks.length}.json`);
      const args = step.vitest
        ? [...step.args, '--reporter=default', '--reporter=json', `--outputFile=${testReport}`]
        : step.args;
      const started = performance.now();
      const check = {
        ...(step.id ? { id: step.id, commandArgs: step.args } : {}),
        kind: step.kind,
        command: [step.command, ...step.args].join(' '),
        startedAt: new Date().toISOString(),
        exitCode: null,
        signal: null,
        ...(step.vitest && reportPath
          ? { testReport: path.relative(path.dirname(reportPath), testReport) }
          : {}),
      };
      report.checks.push(check);
      const label = `${plan.stage} ${report.checks.length}/${plan.checks.length} ${step.kind}`;
      console.log(`[verification] ${label} started: ${check.command}`);
      saveReport();
      try {
        const result = execute(step.command, args, {
          cwd: root,
          env: { ...process.env, ...step.env },
          encoding: 'utf8',
          stdio: quiet ? 'pipe' : 'inherit',
          maxBuffer: 16 * 1024 * 1024,
          shell: process.platform === 'win32',
        });
        check.exitCode = result.status ?? null;
        check.signal = result.signal ?? null;
        if (result.error) check.error = result.error.message;
        if (step.vitest) {
          if (!fs.existsSync(testReport)) {
            if (result.status === 0) check.error = 'Vitest did not produce a result report';
          } else {
            const tests = JSON.parse(fs.readFileSync(testReport, 'utf8'));
            check.tests = {
              total: tests.numTotalTests,
              passed: tests.numPassedTests,
              failed: tests.numFailedTests,
              pending: tests.numPendingTests,
            };
            if (
              result.status === 0 &&
              (!(tests.numPassedTests > 0) || tests.numFailedTests > 0 || tests.success === false)
            )
              check.error = 'No passing tests, failed tests or source diagnostics in Vitest report';
          }
        }
        if (check.exitCode !== 0 || check.signal || check.error) {
          if (quiet) process.stderr.write((result.stdout ?? '') + (result.stderr ?? ''));
          throw new Error(
            `${step.kind} failed (${check.signal ?? check.exitCode}): ${check.error ?? check.command}`,
          );
        }
        afterCheck?.(step, report);
      } catch (error) {
        check.error ??= error.message;
        throw error;
      } finally {
        check.finishedAt = new Date().toISOString();
        check.durationMs = Math.round(performance.now() - started);
        console.log(
          `[verification] ${label} finished: ${check.error ? 'failed' : 'passed'} (${check.durationMs}ms)`,
        );
        saveReport();
      }
    }
    report.passed = true;
    console.log(
      `[verification] ${plan.stage}: ${report.checks.length} checks passed; scope=${plan.scope.join(', ') || 'workflow/docs'}`,
    );
  } catch (error) {
    report.error = error.message;
    console.error(`[verification] ${error.message}`);
  } finally {
    report.finishedAt = new Date().toISOString();
    report.finalLoadAverage = os.loadavg();
    saveReport();
    if (!reportPath) fs.rmSync(temporary, { recursive: true, force: true });
  }
  return report;
}
