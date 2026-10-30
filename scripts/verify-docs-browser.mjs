#!/usr/bin/env node
/** One preview lifecycle for existing Docs browser checks, using the already-built site. */
import { spawn } from 'node:child_process';
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
];
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
function runScript(file, base) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, DOCS_URL: base },
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code !== 0 || signal) reject(new Error(`${file}: ${signal ?? `exit ${code}`}`));
      else resolve();
    });
  });
}
export function runDocsBrowser({ run = runScript, start = startPreview } = {}) {
  return withDocsPreview(async (base) => {
    for (const script of DOCS_BROWSER_SCRIPTS) await run(script, base);
  }, start);
}
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    await runDocsBrowser();
  } catch (error) {
    console.error(`[docs-browser] ${error.message}`);
    process.exitCode = 1;
  }
}
