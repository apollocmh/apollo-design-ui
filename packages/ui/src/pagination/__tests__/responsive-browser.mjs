/** Existing compiled visual preview + current source CSS; never builds package artifacts. */
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import {
  launchBrowser,
  newStablePage,
  stabilizePage,
} from '../../../../../tests/visual/stabilize.mjs';

const preview = process.argv[2];
if (!preview) throw new Error('Pass the running compiled visual preview URL');
const started = performance.now();
const repo = process.cwd();
const source = await createServer({
  configFile: false,
  logLevel: 'error',
  resolve: {
    alias: Object.fromEntries(
      ['theme', 'utils'].map((name) => [
        `@apollo-design/${name}`,
        path.join(repo, 'packages', name, 'src/index.ts'),
      ]),
    ),
  },
  server: { middlewareMode: true },
});
let browser;
let context;
try {
  const { genPaginationStyle } = await source.ssrLoadModule(
    path.join(repo, 'packages/ui/src/pagination/style/index.ts'),
  );
  const css = genPaginationStyle('apollo');
  browser = (await launchBrowser()).browser;
  const stable = await newStablePage(browser, { width: 375, height: 667 });
  context = stable.context;
  const page = stable.page;
  page.setDefaultTimeout(8000);
  const diagnostics = [];
  page.on('pageerror', (error) => diagnostics.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      diagnostics.push(message.text());
  });
  const results = [];
  for (const width of [375, 768, 1440]) {
    for (const variant of ['totalText', 'alignCenter', 'large', 'quickJumperButton']) {
      await page.setViewportSize({ width, height: 900 });
      const url = new URL(preview);
      for (const [key, value] of Object.entries({
        apollo: '1',
        component: 'pagination',
        variant,
        theme: 'light',
      }))
        url.searchParams.set(key, value);
      await page.goto(url.href);
      await page.waitForFunction(() => window.__VISUAL_READY__ === true);
      await page.addStyleTag({ content: css });
      await stabilizePage(page);
      const geometry = await page.evaluate(() => {
        const stage = document.querySelector('#stage');
        const root = document.querySelector('.apollo-pagination');
        if (!stage || !root) throw new Error('Expected actual Pagination inside the visual stage');
        const bounds = stage.getBoundingClientRect();
        const total = root.querySelector('.apollo-pagination-total-text');
        return {
          stageWidth: stage.clientWidth,
          stageScrollWidth: stage.scrollWidth,
          stageHeight: stage.clientHeight,
          stageScrollHeight: stage.scrollHeight,
          total: total && {
            text: total.textContent,
            height: total.clientHeight,
            scrollHeight: total.scrollHeight,
          },
          outside: [...root.children]
            .filter((node) => getComputedStyle(node).display !== 'none')
            .filter((node) => {
              const box = node.getBoundingClientRect();
              return (
                box.left < bounds.left || box.right > bounds.right || box.bottom > bounds.bottom
              );
            })
            .map((node) => node.className),
          optionsDisplay: getComputedStyle(root.querySelector('.apollo-pagination-options'))
            .display,
        };
      });
      const message = `${variant}/${width}: ${JSON.stringify(geometry)}`;
      assert.equal(geometry.stageScrollWidth, geometry.stageWidth, message);
      assert.ok(geometry.stageScrollHeight <= geometry.stageHeight, message);
      assert.deepEqual(geometry.outside, [], message);
      if (geometry.total) {
        assert.equal(geometry.total.text, variant === 'totalText' ? '共 500 条' : '500 items');
        assert.ok(geometry.total.scrollHeight <= geometry.total.height, message);
      }
      if (width === 375) assert.equal(geometry.optionsDisplay, 'none');
      results.push({ variant, width, ...geometry });
    }
  }
  assert.deepEqual(diagnostics, []);
  console.log(
    JSON.stringify({
      passed: true,
      elapsedMs: Math.round(performance.now() - started),
      diagnostics,
      results,
    }),
  );
} finally {
  await context?.close();
  await browser?.close();
  await source.close();
}
