import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser, stabilizePage } from '../visual/stabilize.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const root = path.join(repository, 'tests/browser/fixtures');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-alert-demos-'));
const evidencePath = process.env.ALERT_DEMOS_EVIDENCE ?? '/tmp/apollo-alert-demos.json';
const source = process.env.ALERT_SOURCE !== '0';
const demos = fs
  .readdirSync(path.join(repository, 'packages/ui/src/alert/demo'))
  .filter((x) => x.endsWith('.vue'))
  .map((x) => x.slice(0, -4))
  .sort();
assert.equal(demos.length, 15);
const results = [],
  errors = [],
  publishedSources = [],
  stylesheets = [];
const originalDemoModules = new Set(
  demos.map((name) => path.join(repository, 'packages/ui/src/alert/demo', `${name}.vue`)),
);
const loadedOriginalDemos = new Set();
let server, browser;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [
      vue(),
      {
        name: 'alert-demo-published-boundary',
        transform(_code, id) {
          if (id.endsWith('.css')) stylesheets.push(path.relative(repository, id));
        },
        generateBundle(_opts, bundle) {
          for (const item of Object.values(bundle))
            if (item.type === 'chunk')
              for (const id of Object.keys(item.modules)) {
                const filename = id.split('?')[0];
                if (originalDemoModules.has(filename)) loadedOriginalDemos.add(filename);
                else if (!source && /\/packages\/[^/]+\/src\//.test(id)) publishedSources.push(id);
              }
          assert.equal(loadedOriginalDemos.size, 15, 'all original SFC demos must compile');
          if (source) return;
          assert.deepEqual(publishedSources, []);
          assert.ok(stylesheets.includes('packages/ui/dist/index.css'));
          assert.ok(stylesheets.includes('packages/theme/dist/tokens.css'));
        },
      },
    ],
    define: { __ALERT_SOURCE__: JSON.stringify(source) },
    resolve: {
      alias: source
        ? [
            {
              find: /^@apollo-design\/ui$/,
              replacement: path.join(repository, 'packages/ui/src/index.ts'),
            },
            {
              find: /^@apollo-design\/theme$/,
              replacement: path.join(repository, 'packages/theme/src/index.ts'),
            },
          ]
        : [],
    },
    build: {
      outDir: output,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'AlertDemos.html') },
    },
  });
  server = await preview({
    root,
    configFile: false,
    logLevel: 'warn',
    build: { outDir: output },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({
    viewport: { width: 375, height: 900 },
    reducedMotion: 'reduce',
  });
  page.setDefaultTimeout(5000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  for (const demo of demos)
    for (const theme of ['default', 'dark', 'compact', 'both'])
      for (const width of [375, 768, 1440]) {
        const record = { demo, theme, width, interactions: [] };
        try {
          await page.setViewportSize({ width, height: 1000 });
          await page.mouse.move(1, 1);
          await page.goto(
            `${server.resolvedUrls.local[0]}AlertDemos.html?demo=${demo}&theme=${theme}`,
          );
          await page.waitForFunction(() => window.alertDemoReady === true);
          const frame = page.locator('#alert-demo');
          if (demo === 'loop-banner')
            assert.equal(
              await page
                .locator('.demo-alert-marquee-inner')
                .evaluate((n) => getComputedStyle(n).animationName),
              'none',
            );
          record.state = await frame.evaluate((n) => ({
            text: n.innerText,
            alerts: n.querySelectorAll('[role="alert"]').length,
            width: n.clientWidth,
            scrollWidth: n.scrollWidth,
          }));
          assert.ok(record.state.text.length > 10);
          assert.ok(record.state.alerts > 0 || demo === 'error-boundary');
          assert.ok(
            record.state.scrollWidth <= record.state.width + 1,
            `actual horizontal overflow ${JSON.stringify(record.state)}`,
          );
          await stabilizePage(page, { preserveFocus: true });
          if (theme === 'default' && width === 1440) {
            if (demo === 'closable') {
              const before = await frame.locator('.apollo-alert').count();
              await frame.locator('.apollo-alert-close-icon').first().click();
              await page.waitForFunction(
                (before) =>
                  document.querySelectorAll('#alert-demo .apollo-alert').length === before - 1,
                before,
              );
              record.interactions.push('native close removes exactly one alert');
            }
            if (demo === 'smooth-closed') {
              await frame.locator('.apollo-alert-close-icon').click();
              await frame.getByRole('button', { name: 'Show alert again' }).click();
              assert.equal(await frame.locator('.apollo-alert').count(), 1);
              record.interactions.push('after-close parent removal and remount');
            }
            if (demo === 'error-boundary') {
              await frame.getByRole('button', { name: 'Fail descendant render' }).click();
              await frame.locator('.apollo-alert-error').waitFor();
              assert.match(await frame.innerText(), /task panel could not render/);
              await frame.getByRole('button', { name: 'Remount boundary' }).click();
              assert.equal(await frame.locator('.apollo-alert').count(), 0);
              assert.match(await frame.innerText(), /task panel is ready/);
              record.interactions.push('descendant render capture and key remount');
            }
            if (demo === 'component-token') {
              const input = frame.getByRole('textbox', { name: 'Alert theme draft' }),
                original = await input.elementHandle();
              await input.fill('Saved live draft');
              await input.focus();
              await frame.getByRole('button', { name: 'Use defaults' }).click();
              assert.equal(await input.inputValue(), 'Saved live draft');
              assert.equal(await input.evaluate((n, old) => n === old, original), true);
              await frame.getByRole('button', { name: 'Use custom tokens' }).click();
              assert.equal(
                await frame
                  .locator('.apollo-alert')
                  .first()
                  .evaluate((n) => getComputedStyle(n).borderRadius),
                '16px',
              );
              record.interactions.push(
                'current four-token removal/restoration retains business editor',
              );
            }
            if (demo === 'content-slots') {
              await frame.getByRole('button', { name: '切换插槽 / Toggle slots' }).click();
              assert.equal(await frame.locator('.apollo-alert-title').innerText(), 'Prop title');
              await frame.getByRole('button', { name: '切换插槽 / Toggle slots' }).click();
              await frame.getByRole('button', { name: '更新内容 / Update content' }).click();
              assert.equal(
                await frame.locator('.apollo-alert-title').innerText(),
                'Updated content',
              );
              await frame.getByRole('button', { name: '切换空内容 / Toggle empty' }).click();
              assert.equal(await frame.locator('.apollo-alert-title').count(), 0);
              record.interactions.push('conditional, current and intentional-empty title slots');
            }
          }
          await page.addScriptTag({
            path: createRequire(import.meta.url).resolve('axe-core/axe.min.js'),
          });
          record.violations = await frame.evaluate(async (n) =>
            (await window.axe.run(n)).violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((x) => ({ html: x.html, summary: x.failureSummary })),
            })),
          );
          assert.deepEqual(record.violations, []);
          record.passed = true;
        } catch (error) {
          record.passed = false;
          record.error = error.message;
        }
        results.push(record);
        if (results.length % 30 === 0)
          console.log(
            `Alert real demos ${results.length}/180: failed ${results.filter((x) => !x.passed).length}`,
          );
      }
  const evidence = {
    source,
    implementation: source
      ? 'real SFCs with source UI JS/CSS'
      : 'real SFCs with published UI JS/CSS',
    browser: browser.version(),
    expected: 180,
    actual: results.length,
    results,
    errors,
    stylesheets,
    publishedSources,
    originalDemoModules: [...loadedOriginalDemos].map((id) => path.relative(repository, id)),
    packageBuilds: false,
    passed: results.length === 180 && results.every((x) => x.passed) && errors.length === 0,
  };
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    JSON.stringify({
      path: evidencePath,
      expected: 180,
      actual: results.length,
      passed: results.filter((x) => x.passed).length,
      failures: results
        .filter((x) => !x.passed)
        .map(({ demo, theme, width, error }) => ({ demo, theme, width, error })),
      errors,
    }),
  );
  assert.equal(evidence.passed, true);
} finally {
  await browser?.close();
  await server?.httpServer.close();
  fs.rmSync(output, { recursive: true, force: true });
}
