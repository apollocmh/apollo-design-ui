import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = process.cwd();
const started = performance.now();
const fixture = await mkdtemp(path.join(tmpdir(), 'apollo-listy-native-'));
await writeFile(
  path.join(fixture, 'index.html'),
  `<!doctype html><html lang="en"><head><title>Native Listy</title><link rel="icon" href="data:,"></head><body><main id="app"></main><script type="module">
import {createApp} from 'vue';import Fixture from '/@fs${repo}/packages/ui/src/listy/__tests__/fixtures/NativeListy.vue';import {genListyStyle} from '/@fs${repo}/packages/ui/src/listy/style/index.ts';import {getDesignToken,transformToken} from '@apollo-design/theme';
for(const [name,value] of Object.entries(transformToken(getDesignToken()).vars))document.documentElement.style.setProperty(name,value);const style=document.createElement('style');style.textContent=genListyStyle('apollo')+'*,*::before,*::after{transition:none!important;animation:none!important}';document.head.append(style);createApp(Fixture).mount('#app');
</script></body></html>`,
);
let server;
let browser;
try {
  const packages = await readdir(path.join(repo, 'packages'));
  server = await createServer({
    root: fixture,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: {
      alias: {
        vue: path.join(repo, 'node_modules/vue/dist/vue.esm-bundler.js'),
        ...Object.fromEntries(
          packages.map((name) => [
            `@apollo-design/${name}`,
            path.join(repo, `packages/${name}/src`),
          ]),
        ),
      },
    },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, fixture] } },
  });
  await server.listen();
  const launched = await launchBrowser();
  browser = launched.browser;
  const page = await browser.newPage({
    viewport: { width: 1000, height: 800 },
    reducedMotion: 'reduce',
  });
  const diagnostics = [];
  page.on('pageerror', (error) => diagnostics.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      diagnostics.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0]);
  const settle = async () => {
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          let frames = 0;
          const tick = () => (++frames < 6 ? requestAnimationFrame(tick) : resolve());
          requestAnimationFrame(tick);
        }),
    );
  };
  await page.locator('[data-case="raw"]').focus();
  await page.keyboard.press('PageDown');
  await settle();
  const raw = await page
    .locator('[data-case="raw"]')
    .evaluate((root) => ({ top: root.scrollTop, page: scrollY }));
  await page.locator('[data-case="virtual"] [tabindex="0"]').focus();
  await page.keyboard.press('PageDown');
  await settle();
  const virtual = await page.locator('[data-case="virtual"]').evaluate((root) => ({
    top: root.querySelector('.apollo-listy-holder')?.scrollTop,
    page: scrollY,
    focusedHolder: root.querySelector('.apollo-listy-holder') === document.activeElement,
  }));
  assert.ok(raw.top > 0, 'Raw tabindex operates its scrolling element');
  assert.ok(virtual.top > 0, 'Virtual tabindex operates its actual holder');
  assert.equal(virtual.page, 0, 'Native list scrolling does not scroll the page instead');
  assert.equal(virtual.focusedHolder, true);

  await page.locator('[data-case="raw-sticky"] [data-header="0"]').evaluate((input) => {
    input.value = 'header draft';
    input.dataset.original = 'yes';
    input.focus({ preventScroll: true });
  });
  await page.locator('[data-case="raw-sticky"]').evaluate((root) => {
    const nextHeader = root.querySelector('[data-key="group:number:1"]');
    const header = root.querySelector('[data-key="group:number:0"]');
    root.scrollTop =
      nextHeader.previousElementSibling.offsetTop - header.getBoundingClientRect().height / 2;
  });
  await settle();
  const rawSticky = await page.locator('[data-case="raw-sticky"]').evaluate((root) => {
    const first = root.querySelector('[data-key="group:number:0"]');
    const next = root.querySelector('[data-key="group:number:1"]');
    const input = first.querySelector('input');
    return {
      holderTop: root.getBoundingClientRect().top + root.clientTop,
      first: first.getBoundingClientRect().toJSON(),
      next: next.getBoundingClientRect().toJSON(),
      count: root.querySelectorAll('[data-header="0"]').length,
      focused: input === document.activeElement,
      value: input.value,
      sticky: input.dataset.sticky,
      fixed: input.dataset.fixed,
    };
  });
  assert.equal(rawSticky.count, 1, 'Raw sticky header remains unique');
  assert.equal(
    rawSticky.focused,
    true,
    'Raw sticky updates preserve the actual header editor focus',
  );
  assert.equal(rawSticky.value, 'header draft');
  assert.equal(rawSticky.sticky, 'true');
  assert.equal(rawSticky.fixed, 'false');
  assert.ok(
    Math.abs(rawSticky.first.bottom - rawSticky.next.top) < 2,
    'The next group pushes the previous real header',
  );
  assert.ok(
    rawSticky.first.top < rawSticky.holderTop,
    'The current header moves up at the group boundary',
  );

  const beforeScrollPage = await page.evaluate(() => scrollY);
  await page.locator('[data-action="scroll-raw"]').evaluate((button) => button.click());
  await settle();
  const rawTarget = await page.locator('[data-case="raw-sticky"]').evaluate((root) => ({
    holderTop: root.getBoundingClientRect().top + root.clientTop,
    targetTop: root.querySelector('[data-key="item:number:25"]').getBoundingClientRect().top,
    headerHeight: root.querySelector('[data-key="group:number:1"]').getBoundingClientRect().height,
    page: scrollY,
  }));
  assert.ok(Math.abs(rawTarget.targetTop - rawTarget.holderTop - rawTarget.headerHeight - 5) < 2);
  assert.equal(rawTarget.page, beforeScrollPage, 'Raw scrollTo changes only its own holder');

  await page.locator('[data-action="scroll-virtual"]').evaluate((button) => button.click());
  await settle();
  const virtualSticky = await page.locator('[data-case="virtual-sticky"]').evaluate((root) => {
    const holder = root.querySelector('.apollo-listy-holder');
    const fixed = root.querySelector('.apollo-listy-group-header-fixed');
    return {
      scrollTop: holder.scrollTop,
      holderTop: holder.getBoundingClientRect().top + holder.clientTop,
      headerTop: fixed?.getBoundingClientRect().top,
      key: fixed?.querySelector('[data-header]')?.dataset.header,
      fixedScope: fixed?.querySelector('[data-fixed]')?.dataset.fixed,
      transform: root.querySelector('.apollo-listy-holder-inner')?.style.transform,
    };
  });
  assert.ok(virtualSticky.scrollTop > 500);
  assert.equal(virtualSticky.key, '2');
  assert.equal(virtualSticky.fixedScope, 'true');
  assert.ok(
    Math.abs(virtualSticky.headerTop - virtualSticky.holderTop) < 2,
    'Virtual fixed header compensates the actual nonzero Filler offsetY',
  );

  await page.locator('[data-case="page-sticky"]').evaluate((root) => {
    const next = root.querySelector('[data-key="group:number:1"]');
    const first = root.querySelector('[data-key="group:number:0"]');
    scrollTo(
      0,
      scrollY +
        next.previousElementSibling.getBoundingClientRect().top -
        first.getBoundingClientRect().height / 2,
    );
  });
  await settle();
  const pageSticky = await page.locator('[data-case="page-sticky"]').evaluate((root) => {
    const first = root.querySelector('[data-key="group:number:0"]');
    const next = root.querySelector('[data-key="group:number:1"]');
    return {
      top: first.getBoundingClientRect().top,
      bottom: first.getBoundingClientRect().bottom,
      nextTop: next.getBoundingClientRect().top,
      ownTop: root.scrollTop,
      page: scrollY,
    };
  });
  assert.ok(pageSticky.page > 500);
  assert.equal(pageSticky.ownTop, 0);
  assert.ok(
    pageSticky.top < 0 && pageSticky.bottom > 0,
    'No-height Raw keeps native viewport sticky behavior',
  );
  assert.ok(
    Math.abs(pageSticky.bottom - pageSticky.nextTop) < 2,
    'Page scrolling also preserves the group boundary',
  );

  await page.locator('[data-case="raw-sticky"]').evaluate((root) => {
    root.scrollTop = 0;
  });
  const editor = page.locator('[data-case="raw-sticky"] [data-editor="0"]');
  await editor.evaluate((input) => {
    input.dataset.original = 'yes';
    input.value = 'row draft';
    input.focus({ preventScroll: true });
  });
  await page.locator('[data-action="regroup"]').evaluate((button) => button.click());
  await settle();
  const identity = await page
    .locator('[data-case="raw-sticky"] [data-editor="0"]')
    .evaluate((input) => ({
      original: input.dataset.original,
      value: input.value,
      focused: input === document.activeElement,
    }));
  assert.deepEqual(identity, { original: 'yes', value: 'row draft', focused: true });

  await page.locator('[data-action="unmount"]').evaluate((button) => button.click());
  await settle();
  await page.evaluate(() => {
    scrollTo(0, 0);
    dispatchEvent(new Event('resize'));
  });
  await settle();
  assert.deepEqual(diagnostics, [], 'No Vue, lifecycle or browser errors');
  console.log(
    JSON.stringify({
      ok: true,
      browser: launched.channel,
      raw,
      virtual,
      rawSticky,
      rawTarget,
      virtualSticky,
      pageSticky,
      identity,
      diagnostics,
      elapsedMs: Math.round(performance.now() - started),
    }),
  );
} finally {
  await browser?.close();
  await server?.close();
  await rm(fixture, { recursive: true, force: true });
}
