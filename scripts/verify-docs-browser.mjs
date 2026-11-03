#!/usr/bin/env node
/** One preview lifecycle for existing Docs browser checks, using the already-built site. */
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
export const DOCS_BROWSER_SCRIPTS = [
  'packages/docs/tests/smoke-browser.mjs',
  'docs/audit/tools/stage2-demo-probe.mjs',
  'docs/audit/visual-v3/verify.mjs',
  'packages/docs/tests/menu-browser.mjs',
  'packages/docs/tests/notification-motion-browser.mjs',
  'packages/docs/tests/motion-review-browser.mjs',
  'packages/docs/tests/issue86-site-browser.mjs',
  'packages/docs/tests/issue86-general-browser.mjs',
  'packages/docs/tests/issue86-controls-browser.mjs',
  'packages/docs/tests/issue86-data-browser.mjs',
  'packages/docs/tests/issue86-feedback-browser.mjs',
  'tests/browser/scroll-animation.mjs',
];
export function docsBrowserScriptsForFiles(files) {
  const selected = new Set();
  for (const file of files) {
    if (
      [
        'scripts/verify-docs-browser.mjs',
        'tests/visual/stabilize.mjs',
        '.github/actions/browser/action.yml',
      ].includes(file)
    )
      for (const script of DOCS_BROWSER_SCRIPTS) selected.add(script);
    else if (DOCS_BROWSER_SCRIPTS.includes(file)) selected.add(file);
    else if (
      /^tests\/compat\/motion-review\//.test(file) ||
      file === 'packages/docs/tests/motion-sampling.mjs'
    )
      selected.add('packages/docs/tests/motion-review-browser.mjs');
    else if (/^docs\/audit\/visual-v3\//.test(file) && /\.[cm]?js$/.test(file))
      selected.add('docs/audit/visual-v3/verify.mjs');
  }
  return DOCS_BROWSER_SCRIPTS.filter((script) => selected.has(script));
}
async function startPreview() {
  const { preview } = await import('vite');
  return preview({
    root: path.join(root, 'packages/docs'),
    configFile: false,
    base: process.env.DOCS_BASE ?? '/apollo-design-ui/',
    logLevel: 'warn',
    build: { outDir: 'dist' },
    preview: { host: '127.0.0.1', port: 0, strictPort: true },
  });
}
export async function withDocsPreview(run, start = startPreview) {
  const server = await start();
  try {
    return await run(server.resolvedUrls.local[0].replace(/\/$/, ''));
  } finally {
    await new Promise((resolve, reject) =>
      server.httpServer.close((error) => (error ? reject(error) : resolve())),
    );
  }
}
function runScript(file, base, outputRoot) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.resolve(root, file)], {
      cwd: outputRoot,
      stdio: 'inherit',
      env: { ...process.env, DOCS_URL: base },
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code !== 0 || signal)
        reject(
          Object.assign(new Error(`${file}: ${signal ?? `exit ${code}`}`), {
            exitCode: code,
            signal,
          }),
        );
      else resolve({ exitCode: code, signal });
    });
  });
}
export function runDocsBrowser({
  scripts = DOCS_BROWSER_SCRIPTS,
  run = runScript,
  start = startPreview,
} = {}) {
  let outputRoot;
  if (run === runScript) {
    outputRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-docs-browser-'));
    for (const entry of ['node_modules', 'packages', 'tests'])
      fs.symlinkSync(path.join(root, entry), path.join(outputRoot, entry), 'dir');
    fs.mkdirSync(path.join(outputRoot, 'docs/audit/evidence'), { recursive: true });
    console.log(`[docs-browser] Evidence: ${path.join(outputRoot, 'docs/audit/evidence')}`);
  }
  const result = {
    outputRoot,
    sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
    }).trim(),
    startedAt: new Date().toISOString(),
    passed: false,
    checks: scripts.map((script) => ({ script, status: 'not_run' })),
  };
  const save = () => {
    if (outputRoot)
      fs.writeFileSync(
        path.join(outputRoot, 'docs/audit/evidence/browser-checks.json'),
        `${JSON.stringify(result, null, 2)}\n`,
      );
  };
  save();
  return withDocsPreview(async (base) => {
    result.base = base;
    const failures = [];
    for (const check of result.checks) {
      const started = performance.now();
      check.status = 'running';
      check.startedAt = new Date().toISOString();
      save();
      try {
        await run(check.script, base, outputRoot);
        check.status = 'passed';
      } catch (error) {
        check.status = 'failed';
        check.error = error.message;
        check.exitCode = error.exitCode ?? null;
        check.signal = error.signal ?? null;
        failures.push(error);
      } finally {
        check.finishedAt = new Date().toISOString();
        check.durationMs = Math.round(performance.now() - started);
        console.log(`[docs-browser] ${check.script}: ${check.status} (${check.durationMs}ms)`);
        save();
      }
    }
    result.passed = failures.length === 0 && result.checks.length > 0;
    result.finishedAt = new Date().toISOString();
    save();
    if (!result.passed)
      throw Object.assign(
        new AggregateError(
          failures,
          failures.map((error) => error.message).join('\n') || 'No Docs browser checks selected',
        ),
        { report: result },
      );
    return result;
  }, start).catch((error) => {
    result.passed = false;
    result.error = error.message;
    result.finishedAt = new Date().toISOString();
    save();
    throw error;
  });
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    const scripts = process.argv.slice(2);
    await runDocsBrowser(scripts.length ? { scripts } : {});
  } catch (error) {
    console.error(`[docs-browser] ${error.message}`);
    process.exitCode = 1;
  }
}
