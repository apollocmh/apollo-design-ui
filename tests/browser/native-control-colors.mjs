import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-native-colors-'));
const checks = [];
const check = (name, actual, expected) => {
  assert.deepEqual(actual, expected, name);
  checks.push({ name, actual, expected });
};
let server;
let browser;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'vue-reactivity.html') },
    },
  });
  server = await preview({
    root,
    configFile: false,
    logLevel: 'warn',
    build: { outDir },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=native-control-colors`);
  await page.locator('[data-control-theme="dark"]').waitFor();
  for (const mode of ['light', 'dark']) {
    const section = page.locator(`[data-control-theme="${mode}"]`);
    for (const kind of ['button', 'input', 'select', 'textarea', 'disabled']) {
      const styles = await section.evaluate((node, kind) => {
        const props = (element) => {
          const css = getComputedStyle(element);
          return { color: css.color, background: css.backgroundColor };
        };
        return {
          actual: props(node.querySelector(`[data-native="${kind}"]`)),
          expected: props(node.querySelector(`[data-reference="${kind}"]`)),
        };
      }, kind);
      check(`${mode} ${kind} retains browser color pairing`, styles.actual, styles.expected);
    }
    check(
      `${mode} explicit consumer color`,
      await section.locator('[data-custom]').evaluate((node) => getComputedStyle(node).color),
      'rgb(10, 20, 30)',
    );
    const themeColor = await section
      .locator('[data-theme-text]')
      .evaluate((node) => getComputedStyle(node).color);
    check(
      `${mode} Apollo Button keeps themed color`,
      await section
        .locator('[data-apollo-button]')
        .evaluate((node) => getComputedStyle(node).color),
      themeColor,
    );
    check(
      `${mode} Apollo Input keeps themed color`,
      await section.locator('.apollo-input').evaluate((node) => getComputedStyle(node).color),
      themeColor,
    );
  }
  await page
    .getByRole('textbox', { name: 'Component input dark', exact: true })
    .fill('Current value');
  check(
    'component model and multiple instances still update',
    await page.getByRole('textbox', { name: 'Component input light', exact: true }).inputValue(),
    'Current value',
  );
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async () =>
    (await window.axe.run(document.querySelector('main'))).violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => node.failureSummary),
    })),
  );
  check('native and component controls pass browser axe', violations, []);
  check('no Vue/browser errors', errors, []);
  const result = { browser: await browser.version(), checks };
  writeFileSync('/tmp/apollo-native-control-colors.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
