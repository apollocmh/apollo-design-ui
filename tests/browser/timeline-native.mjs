/** Timeline/Steps current native inputs against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-timeline-native-'));
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
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' ||
      (message.type() === 'warning' && message.text().includes('[Vue warn]'))
    )
      errors.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=timeline-native`);
  const timeline = page.locator('[data-native-timeline]');
  const steps = page.locator('[data-native-steps]');
  const input = page.getByRole('textbox', { name: 'Timeline native input', exact: true });
  const rootNode = await timeline.elementHandle();
  const inputNode = await input.elementHandle();
  await input.fill('kept timeline input');
  await page.getByRole('button', { name: 'Update timeline data', exact: true }).click();
  assert.deepEqual(await timeline.locator('.apollo-timeline-item-title').allTextContents(), [
    'Beta updated',
    'Alpha updated',
  ]);
  await page.getByRole('button', { name: 'Change timeline layout', exact: true }).click();
  assert.deepEqual(await timeline.locator('.apollo-timeline-item-title').allTextContents(), [
    'Alpha updated',
    'Beta updated',
  ]);
  assert.match(await timeline.getAttribute('class'), /apollo-timeline-horizontal/);
  assert.match(await timeline.getAttribute('style'), /--apollo-timeline-head-span-ptg:\s*35%/);
  await page.getByRole('button', { name: 'Toggle timeline alternate', exact: true }).click();
  assert.doesNotMatch(await timeline.getAttribute('style'), /--apollo-timeline-head-span/);
  await page.getByRole('button', { name: 'Update timeline attrs', exact: true }).click();
  assert.match(await timeline.getAttribute('class'), /native-new/);
  assert.doesNotMatch(await timeline.getAttribute('class'), /native-old/);
  assert.match(await timeline.getAttribute('style'), /color:\s*blue/);
  assert.match(await timeline.getAttribute('style'), /--timeline-accent:\s*green/);
  assert.match(await steps.getAttribute('class'), /steps-new/);
  assert.doesNotMatch(await steps.getAttribute('class'), /steps-old/);
  assert.match(await steps.getAttribute('style'), /color:\s*blue/);
  await page.getByRole('button', { name: 'Change timeline defaults', exact: true }).click();
  assert.match(await timeline.getAttribute('class'), /apollo-timeline-rtl/);
  assert.match(await timeline.getAttribute('class'), /configured-new/);
  assert.doesNotMatch(await timeline.getAttribute('class'), /configured-old/);
  assert.equal(await input.inputValue(), 'kept timeline input');
  assert.equal(await input.evaluate((current, old) => current === old, inputNode), true);
  assert.equal(await timeline.evaluate((current, old) => current === old, rootNode), true);
  await page.getByRole('button', { name: 'Advance current step', exact: true }).click();
  await page.waitForFunction(
    () =>
      document.querySelector(
        '[data-native-steps] .apollo-steps-item-active .apollo-steps-item-title',
      )?.textContent === 'Step 4',
  );
  assert.match(await steps.getAttribute('class'), /step-current-4/);
  assert.match(await steps.getAttribute('style'), /opacity:\s*0.5/);
  assert.ok((await steps.locator('.apollo-steps-item-ellipsis').count()) > 0);
  await page.getByRole('button', { name: 'Expand native steps', exact: true }).click();
  assert.equal(await steps.locator('.apollo-steps-item').count(), 8);
  assert.equal(await steps.locator('.apollo-steps-item-ellipsis').count(), 0);
  await steps
    .locator('.apollo-steps-item-title')
    .filter({ hasText: /^Step 2$/ })
    .click();
  assert.deepEqual(JSON.parse(await page.locator('#timeline-native-state').innerText()), {
    current: 2,
    changes: 1,
  });
  assert.match(await steps.getAttribute('class'), /step-current-2/);
  assert.deepEqual(errors, []);
  console.log(
    `PASS Timeline/Steps native reactivity: current data/reverse/orientation/mode/titleSpan/attrs/provider defaults, keyed input and root identity, step current/collapse/semantic functions/controlled click once; ${await browser.version()}; zero browser/Vue errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
