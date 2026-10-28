/** All original Timeline SFCs, four themes, three viewports and real controllers. */
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
const repository = path.resolve(root, '../../..');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-timeline-demos-'));
const source = process.env.TIMELINE_SOURCE !== '0';
const evidencePath = process.env.TIMELINE_DEMOS_EVIDENCE ?? '/tmp/apollo-timeline-demos.json';
const alias = source
  ? [
      {
        find: /^@apollo-design\/ui$/,
        replacement: path.join(repository, 'packages/ui/src/index.ts'),
      },
    ]
  : [];
const expected = {
  alternate: [1, 6],
  basic: [1, 4],
  'component-token': [1, 4],
  custom: [1, 4],
  end: [1, 4],
  horizontal: [3, 12],
  'horizontal-debug': [3, 12],
  'native-slots': [1, 2],
  pending: [1, 4],
  'pending-legacy': [2, 4],
  semantic: [1, 5],
  'style-class': [2, 6],
  title: [1, 4],
  'title-span': [3, 12],
  variant: [1, 4],
};
const results = [],
  errors = [],
  legacyWarnings = [],
  stylesheets = [],
  publishedSources = [];
let server, browser;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    define: { __TIMELINE_SOURCE__: JSON.stringify(source) },
    plugins: [
      vue(),
      {
        name: 'timeline-demo-published-boundary',
        transform(_code, id) {
          if (id.endsWith('.css')) stylesheets.push(path.relative(repository, id));
        },
        generateBundle(_options, bundle) {
          if (source) return;
          for (const output of Object.values(bundle)) {
            if (output.type !== 'chunk') continue;
            for (const id of Object.keys(output.modules)) {
              if (id.includes('/packages/ui/src/') && !id.includes('/timeline/demo/'))
                publishedSources.push(path.relative(repository, id));
            }
          }
          assert.deepEqual(publishedSources, [], 'only original demo SFCs may come from UI source');
          assert.ok(stylesheets.includes('packages/ui/dist/index.css'));
          assert.ok(stylesheets.includes('packages/theme/dist/tokens.css'));
        },
      },
    ],
    resolve: { alias },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'TimelineDemos.html') },
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
  page.setDefaultTimeout(5000);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.text().includes('[apollo: Timeline]') && message.text().includes('is deprecated'))
      legacyWarnings.push(message.text());
    else if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}TimelineDemos.html`);
  await page.waitForFunction(() => Boolean(window.timelineDemos));
  assert.deepEqual(
    await page.evaluate(() => window.timelineDemos.names),
    Object.keys(expected).sort(),
  );
  assert.equal(await page.locator('style[data-timeline-source-css]').count(), source ? 1 : 0);
  await page.addStyleTag({
    content: '*,*::before,*::after{animation:none!important;transition:none!important}',
  });
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const frame = page.locator('#timeline-demo-frame');
  const lists = frame.locator('.apollo-timeline');
  const property = (selector, name) =>
    frame
      .locator(selector)
      .first()
      .evaluate((node, name) => getComputedStyle(node).getPropertyValue(name).trim(), name);
  const contents = () => frame.locator('.apollo-timeline-item-content').allTextContents();
  const button = (name) => frame.getByRole('button', { name, exact: true });

  async function interact(demo) {
    if (demo === 'component-token') {
      const node = await lists.elementHandle();
      assert.equal(await property('.apollo-timeline-item-icon', 'width'), '14px');
      assert.equal(await property('li', 'padding-bottom'), '28px');
      await button('Toggle component tokens').click();
      assert.equal(await property('.apollo-timeline-item-icon', 'width'), '10px');
      assert.equal(await property('.apollo-timeline-item-icon', 'border-top-width'), '2px');
      await button('Toggle component tokens').click();
      assert.equal(await property('.apollo-timeline-item-icon', 'width'), '14px');
      assert.equal(await lists.evaluate((n, old) => n === old, node), true);
    }
    if (demo === 'pending') {
      const before = await contents();
      await button('Toggle Reverse').click();
      assert.deepEqual(await contents(), [...before].reverse());
      await button('Toggle Reverse').click();
      assert.deepEqual(await contents(), before);
      assert.equal(await frame.locator('.apollo-icon-spin').count(), 1);
    }
    if (demo === 'title') {
      for (const mode of ['End', 'Alternate', 'Start']) {
        const radio = frame.getByRole('radio', { name: mode, exact: true });
        await radio.check();
        assert.equal(await radio.isChecked(), true);
        const placements = await frame
          .locator('li')
          .evaluateAll((nodes) =>
            nodes.map((node) => (node.className.includes('placement-end') ? 'end' : 'start')),
          );
        assert.deepEqual(
          placements,
          mode === 'End'
            ? ['end', 'end', 'end', 'end']
            : mode === 'Alternate'
              ? ['start', 'end', 'start', 'end']
              : ['start', 'start', 'start', 'start'],
        );
      }
    }
    if (demo === 'native-slots') {
      const editor = frame.getByRole('textbox', { name: 'Note created', exact: true });
      const node = await editor.elementHandle();
      await editor.fill('Actual demo draft');
      await button('Reverse items').click();
      assert.deepEqual(await frame.locator('strong').allTextContents(), [
        'Reviewed · 0',
        'Created · 1',
      ]);
      await button('Update item data').click();
      assert.deepEqual(await frame.locator('strong').allTextContents(), [
        'Reviewed! · 0',
        'Created! · 1',
      ]);
      assert.equal(await editor.evaluate((n, old) => n === old, node), true);
      assert.equal(await editor.inputValue(), 'Actual demo draft');
      await button('Reverse items').click();
      await button('Toggle empty content').click();
      assert.equal(await lists.innerText(), '');
      assert.equal(await frame.locator('input').count(), 0);
      await button('Toggle empty content').click();
      assert.equal(await frame.locator('input').count(), 2);
      await button('Toggle item slots').click();
      assert.deepEqual(await contents(), ['Created!', 'Reviewed!']);
      assert.equal(await frame.locator('input').count(), 0);
      await button('Toggle item slots').click();
      assert.equal(await frame.locator('input').count(), 2);
    }
  }

  for (const [viewport, width] of [
    ['mobile', 375],
    ['tablet', 768],
    ['desktop', 1200],
  ]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const theme of ['default', 'dark', 'compact', 'both']) {
      for (const [demo, [listCount, itemCount]] of Object.entries(expected)) {
        let geometry;
        try {
          await page.evaluate((patch) => window.timelineDemos.set(patch), { demo, theme });
          assert.equal(await lists.count(), listCount);
          assert.equal(await lists.locator(':scope > li').count(), itemCount);
          assert.equal(await lists.locator('li[tabindex], li[role="button"]').count(), 0);
          geometry = await frame.evaluate((node) => {
            const rect = node.getBoundingClientRect();
            const timelines = [...node.querySelectorAll('.apollo-timeline')].map((list) => {
              const box = list.getBoundingClientRect();
              const axis = [...list.querySelectorAll('.apollo-timeline-item-icon')].map((icon) => {
                const rect = icon.getBoundingClientRect();
                return rect.top + rect.height / 2;
              });
              const regions = [
                ...list.querySelectorAll(
                  '.apollo-timeline-item-title,.apollo-timeline-item-content',
                ),
              ].map((region) => {
                const rect = region.getBoundingClientRect();
                return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
              });
              return {
                width: box.width,
                height: box.height,
                right: box.right,
                scrollWidth: list.scrollWidth,
                clientWidth: list.clientWidth,
                orientation: getComputedStyle(list).flexDirection,
                horizontal: list.classList.contains('apollo-timeline-horizontal'),
                railOffsets: [...list.querySelectorAll(':scope > li')].flatMap((item) => {
                  const icon = item
                    .querySelector('.apollo-timeline-item-icon')
                    ?.getBoundingClientRect();
                  const rail = item
                    .querySelector('.apollo-timeline-item-rail')
                    ?.getBoundingClientRect();
                  return icon && rail
                    ? [Math.abs(icon.top + icon.height / 2 - rail.top - rail.height / 2)]
                    : [];
                }),
                axisAligned: Math.max(...axis) - Math.min(...axis) < 1,
                overlapping: regions.some((a, index) =>
                  regions
                    .slice(index + 1)
                    .some(
                      (b) =>
                        Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
                        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1,
                    ),
                ),
                verticallyContained: regions.every(
                  (r) => r.top >= box.top - 1 && r.bottom <= box.bottom + 1,
                ),
              };
            });
            const outside = [
              ...node.querySelectorAll('.apollo-timeline-item-title,.apollo-timeline-item-content'),
            ].flatMap((region) => {
              const bounds = region.getBoundingClientRect();
              return bounds.left < rect.left - 1 || bounds.right > rect.right + 1
                ? [{ text: region.textContent, left: bounds.left, right: bounds.right }]
                : [];
            });
            return {
              width: rect.width,
              scrollWidth: node.scrollWidth,
              outside,
              background: getComputedStyle(node).backgroundColor,
              timelines,
            };
          });
          assert.equal(
            geometry.background,
            theme === 'dark' || theme === 'both' ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
          );
          assert.ok(
            geometry.width <= width && geometry.scrollWidth <= geometry.width + 1,
            'actual demo fits viewport',
          );
          assert.ok(
            geometry.timelines.every((list) => list.width > 0 && list.height > 0),
            'all actual lists are visible',
          );
          assert.deepEqual(geometry.outside, [], 'actual text regions fit the viewport');
          if (demo.startsWith('horizontal')) {
            assert.ok(geometry.timelines.every((list) => list.orientation === 'row'));
            assert.ok(
              geometry.timelines.every((list) => list.axisAligned),
              'horizontal records share one axis',
            );
            assert.ok(
              geometry.timelines.every((list) => list.railOffsets.every((offset) => offset < 1)),
              'horizontal rails connect actual dot centers',
            );
            assert.ok(
              geometry.timelines.every((list) => !list.overlapping && list.verticallyContained),
              'horizontal title/content stays separate and contained',
            );
          }
          if (demo === 'basic')
            assert.equal(
              await property('li', 'padding-bottom'),
              theme === 'compact' || theme === 'both' ? '10px' : '20px',
            );
          await interact(demo);
          const violations = await frame.evaluate(async (node) =>
            (await window.axe.run(node)).violations.map((violation) => ({
              id: violation.id,
              nodes: violation.nodes.map((n) => n.failureSummary),
            })),
          );
          assert.deepEqual(violations, [], 'actual demo state passes axe');
          results.push({ demo, theme, viewport, passed: true, geometry });
        } catch (error) {
          results.push({ demo, theme, viewport, passed: false, geometry, error: error.message });
          await page.screenshot({
            path: `/tmp/apollo-timeline-demo-${demo}-${theme}-${viewport}.png`,
            fullPage: true,
          });
        }
      }
    }
    console.log(
      `${source ? 'source' : 'published'} ${viewport}: ${results.filter((r) => r.passed).length}/${results.length} cumulative passed`,
    );
  }
  const evidence = {
    source,
    implementation: source ? 'source JS + source CSS' : 'published JS + published CSS',
    stylesheets,
    publishedSources,
    browser: await browser.version(),
    demos: Object.keys(expected).length,
    themes: 4,
    viewports: 3,
    results,
    errors,
    legacyWarnings: [...new Set(legacyWarnings)],
    passed: results.length === 180 && results.every((r) => r.passed) && errors.length === 0,
  };
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  for (const result of results.filter((r) => !r.passed)) console.error(JSON.stringify(result));
  assert.equal(evidence.passed, true, `Timeline demo matrix failed; see ${evidencePath}`);
  console.log(
    `PASS all 15 original Timeline demos × 4 themes × 3 viewports; real token, radio, reverse and conditional slot controls; zero browser/Vue errors; ${evidencePath}`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
