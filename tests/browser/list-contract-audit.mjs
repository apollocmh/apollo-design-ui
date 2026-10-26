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
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-list-contract-'));
const results = [];
const check = (name, actual, expected) => {
  results.push({ name, actual, expected, passed: actual === expected });
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
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' ||
      (message.type() === 'warning' && message.text().includes('[Vue warn]'))
    )
      errors.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=list-contract-audit`);
  await page.locator('#tokens .apollo-list-item').waitFor();
  const css = (selector, property) =>
    page
      .locator(selector)
      .first()
      .evaluate((node, property) => getComputedStyle(node).getPropertyValue(property), property);
  check(
    'theme padding inherits into data container',
    await css('#tokens .apollo-list-item', 'padding'),
    '21px 23px',
  );
  check(
    'small component token',
    await css('#tokens-small .apollo-list-item', 'padding'),
    '7px 11px',
  );
  check(
    'large component token',
    await css('#tokens-large .apollo-list-item', 'padding'),
    '25px 27px',
  );
  check(
    'header component token',
    await css('#tokens > .apollo-list-header', 'background-color'),
    'rgb(221, 238, 255)',
  );
  check(
    'footer component token',
    await css('#tokens > .apollo-list-footer', 'background-color'),
    'rgb(238, 221, 255)',
  );
  check(
    'empty component token',
    await css('#tokens-empty .apollo-list-empty-text', 'padding'),
    '31px',
  );
  check(
    'meta component token',
    await css('#tokens .apollo-list-item-meta', 'margin-bottom'),
    '17px',
  );
  check(
    'avatar component token',
    await css('#tokens .apollo-list-item-meta-avatar', 'margin-inline-end'),
    '19px',
  );
  check(
    'title component token',
    await css('#tokens .apollo-list-item-meta-title', 'margin-bottom'),
    '13px',
  );
  check(
    'description component token',
    await css('#tokens .apollo-list-item-meta-description', 'font-size'),
    '18px',
  );
  check(
    'native variable precedence and inheritance',
    await css('#native-token .apollo-list-item', 'padding'),
    '33px 35px',
  );
  check('Provider RTL reaches actual direction', await css('#rtl', 'direction'), 'rtl');
  check(
    'raw true does not create a header',
    await page.locator('#primitive-content .apollo-list-header').count(),
    0,
  );
  check(
    'raw true does not create a heading',
    await page.locator('#primitive-content h4').count(),
    0,
  );
  check(
    'numeric description survives shared normalization',
    await page.locator('#primitive-content .apollo-list-item-meta-description').textContent(),
    '0',
  );
  check(
    'numeric empty text survives fallback selection',
    await page.locator('#zero-empty .apollo-list-empty-text').textContent(),
    '0',
  );
  check(
    'RTL no-flex actions float to inline end',
    await css('#rtl .apollo-list-item-action', 'float'),
    'inline-end',
  );
  check(
    'nested size is owned by nearest List',
    await css('#inner .apollo-list-item', 'padding'),
    '16px 24px',
  );
  check(
    'nested vertical layout does not leak',
    await css('#inner .apollo-list-item-meta', 'margin-bottom'),
    '0px',
  );
  check(
    'nested title size does not leak',
    await css('#inner .apollo-list-item-meta-title', 'font-size'),
    '14px',
  );
  check(
    'nested split false does not inherit parent border',
    await css('#inner .apollo-list-item', 'border-bottom-width'),
    '0px',
  );
  check(
    'loading region has room for its indicator',
    (await page.locator('#thin-loading .apollo-spin').boundingBox()).height >= 40,
    true,
  );
  check(
    'numeric loading description is visible',
    await page
      .locator('#thin-loading .apollo-spin-description')
      .textContent()
      .catch(() => null),
    '0',
  );
  check(
    'top-only pagination is not content after rows',
    await page.locator('#top-pagination.apollo-list-something-after-last-item').count(),
    0,
  );
  await page.locator('#before-list').focus();
  await page.keyboard.press('Tab');
  check(
    'native keyboard target',
    await page.locator('#native-action').evaluate((node) => node === document.activeElement),
    true,
  );
  check(
    'native focus indicator is retained',
    (await css('#native-action', 'outline-style')) !== 'none',
    true,
  );
  await page.keyboard.press('Space');
  check(
    'native keyboard action invokes the current handler',
    await page.locator('#native-action-count').textContent(),
    '1',
  );
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => {
    const result = await axe.run({
      include: [
        '#native-focus',
        '#tokens',
        '#tokens-empty',
        '#inner',
        '#primitive-content',
        '#zero-empty',
      ],
    });
    return result.violations.map((violation) => ({
      id: violation.id,
      nodes: violation.nodes.map((node) => ({ html: node.html, summary: node.failureSummary })),
    }));
  });
  check('native List passes real browser axe', JSON.stringify(violations), '[]');
  for (const width of [375, 900, 1300, 1700]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(80);
    check(
      `sparse grid at ${width}`,
      await page
        .locator('#sparse-grid .apollo-list-container > div')
        .first()
        .evaluate((node) => node.style.width),
      width < 768 ? '100%' : '33.3333%',
    );
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await page.waitForTimeout(80);
  const mobileExtra = await page.locator('#stable > .apollo-list-extra').boundingBox();
  const mobileContent = await page.locator('#stable > .apollo-list-spin').boundingBox();
  check(
    'root extra stacks below content on mobile',
    mobileExtra.y >= mobileContent.y + mobileContent.height - 1,
    true,
  );
  check(
    'content width component token',
    await css('#tokens .apollo-list-item-main', 'min-width'),
    'min(100%, 180px)',
  );
  check(
    'narrow action margin targets actual DOM',
    await css('#native-focus .apollo-list-item-action', 'margin-inline-start'),
    '12px',
  );
  await page.setViewportSize({ width: 1300, height: 900 });
  const desktopExtra = await page.locator('#stable > .apollo-list-extra').boundingBox();
  const desktopContent = await page.locator('#stable > .apollo-list-spin').boundingBox();
  check(
    'root extra sits beside content on desktop',
    desktopExtra.x >= desktopContent.x + desktopContent.width - 1,
    true,
  );
  await page.locator('#toggle-grid-config').click();
  await page.waitForTimeout(80);
  check(
    'responsive configuration can be disabled',
    await page
      .locator('#sparse-grid .apollo-list-container > div')
      .first()
      .evaluate((node) => node.style.width),
    '50%',
  );
  await page.locator('#toggle-grid-config').click();
  await page.waitForTimeout(80);
  check(
    'responsive configuration resumes current breakpoint',
    await page
      .locator('#sparse-grid .apollo-list-container > div')
      .first()
      .evaluate((node) => node.style.width),
    '33.3333%',
  );
  const editor = await page.getByRole('textbox', { name: 'Stable draft' }).elementHandle();
  await editor.fill('Native draft');
  await editor.focus();
  // Programmatic controls keep the editor focused, exposing any subtree replacement.
  for (const selector of ['#toggle-layout', '#toggle-extra', '#toggle-layout', '#toggle-extra']) {
    await page.locator(selector).evaluate((node) => node.click());
    await page.waitForTimeout(30);
    check(
      `native editor identity after ${selector}`,
      await page.evaluate(
        (node) => node === document.querySelector('[aria-label="Stable draft"]'),
        editor,
      ),
      true,
    );
    check(
      `native editor focus after ${selector}`,
      await page.evaluate((node) => node === document.activeElement, editor),
      true,
    );
    check(
      `native editor value after ${selector}`,
      await page.getByRole('textbox', { name: 'Stable draft' }).inputValue(),
      'Native draft',
    );
  }
  check('root extra is rendered', await page.locator('#stable > .apollo-list-extra').count(), 1);
  check(
    'horizontal extra semantics are rendered',
    await css('#stable .semantic-extra', 'color').catch(() => null),
    'rgb(12, 34, 56)',
  );
  await page.locator('#toggle-theme').click();
  check(
    'theme removal restores static defaults',
    await css('#tokens .apollo-list-item', 'padding'),
    '12px 0px',
  );
  await page.locator('#toggle-theme').click();
  check(
    'theme restoration updates current content',
    await css('#tokens .apollo-list-item', 'padding'),
    '21px 23px',
  );
  check('no Vue or browser errors', errors.join('\n'), '');
  await page.locator('#tokens').screenshot({ path: '/tmp/apollo-list-tokens-desktop.png' });
  await page.locator('#stable').screenshot({ path: '/tmp/apollo-list-extra-desktop.png' });
  const evidence = process.env.LIST_EVIDENCE ?? '/tmp/apollo-list-browser.json';
  writeFileSync(evidence, JSON.stringify({ browser: await browser.version(), results }, null, 2));
  console.log(
    JSON.stringify(
      { total: results.length, failed: results.filter((result) => !result.passed), evidence },
      null,
      2,
    ),
  );
  assert.equal(results.filter((result) => !result.passed).length, 0);
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
