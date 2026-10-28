import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-typography-contracts-'));
const results = [],
  errors = [];
let server, browser;
const check = async (name, run) => {
  try {
    results.push({ name, passed: true, actual: await run() });
  } catch (e) {
    results.push({ name, passed: false, error: e.message });
  }
};
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: {
      alias: process.env.TYPOGRAPHY_SOURCE
        ? [
            {
              find: /^@apollo-design\/ui$/,
              replacement: path.resolve(root, '../../../packages/ui/src/index.ts'),
            },
          ]
        : [],
    },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'typography-contracts.html') },
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
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  page.setDefaultTimeout(4000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}typography-contracts.html`);
  await page.waitForFunction(() => Boolean(window.typographyAudit));
  const set = async (patch) => {
    await page.evaluate((patch) => window.typographyAudit.set(patch), patch);
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter((animation) => Number.isFinite(animation.effect?.getTiming().iterations ?? 1))
          .map((animation) => animation.finished.catch(() => {})),
      );
    });
  };
  for (const mode of ['default', 'dark', 'compact', 'both']) {
    await set({ mode, tokenStage: 0 });
    await check(`${mode}: two existing title tokens follow replacement and removal`, async () => {
      const title = page.locator('[data-second-title]');
      const measure = () =>
        title.evaluate((n) => {
          const s = getComputedStyle(n);
          return {
            top: parseFloat(s.marginTop),
            bottom: parseFloat(s.marginBottom),
            size: parseFloat(s.fontSize),
          };
        });
      const initial = await measure();
      await set({ tokenStage: 1 });
      const changed = await measure();
      assert.ok(Math.abs(changed.top - changed.size * 2) < 0.1, JSON.stringify(changed));
      assert.ok(Math.abs(changed.bottom - changed.size * 0.8) < 0.1, JSON.stringify(changed));
      await set({ tokenStage: 2 });
      const zero = await measure();
      assert.equal(zero.top, 0);
      assert.equal(zero.bottom, 0);
      await set({ tokenStage: 0 });
      assert.deepEqual(await measure(), initial);
      return { initial, changed };
    });
  }
  await check(
    'all Link semantic tones match text and native anchor focus consumes current decoration',
    async () => {
      for (const mode of ['default', 'dark', 'compact', 'both']) {
        await set({ mode });
        for (const kind of ['secondary', 'success', 'warning', 'danger']) {
          // The anchor also transitions its inherited colour after the themed root.
          await page.waitForFunction((kind) => {
            const text = document.querySelector(`[data-tone-text="${kind}"]`);
            const link = document.querySelector(`[data-tone-link="${kind}"] a`);
            return text && link && getComputedStyle(text).color === getComputedStyle(link).color;
          }, kind);
          const text = await page
            .locator(`[data-tone-text="${kind}"]`)
            .evaluate((n) => getComputedStyle(n).color);
          const link = await page
            .locator(`[data-tone-link="${kind}"] a`)
            .evaluate((n) => getComputedStyle(n).color);
          assert.equal(link, text, `${mode}/${kind}`);
        }
        const link = page.locator('[data-focus-link] a');
        await link.focus();
        assert.equal(
          await link.evaluate((n) => getComputedStyle(n).textDecorationLine),
          'overline',
        );
      }
    },
  );
  await set({ mode: 'default', tokenStage: 0, editing: true, minRows: 2, maxRows: 4 });
  await check(
    'editor autoSize consumes min/max rows and keeps a draft during dynamic configuration',
    async () => {
      const editor = page.locator('#editable textarea');
      const original = await editor.elementHandle();
      await editor.fill('A long text that must wrap in a narrow editing area. '.repeat(20));
      const before = await editor.evaluate((n) => ({
        height: n.clientHeight,
        line: parseFloat(getComputedStyle(n).lineHeight),
        scroll: n.scrollHeight,
      }));
      assert.ok(before.height >= before.line * 2, JSON.stringify(before));
      assert.ok(before.height <= before.line * 4 + 12, JSON.stringify(before));
      await set({ minRows: 3, maxRows: 3 });
      assert.equal(await editor.evaluate((n, old) => n === old, original), true);
      assert.ok((await editor.inputValue()).startsWith('A long text'));
      const after = await editor.evaluate((n) => ({
        height: n.clientHeight,
        line: parseFloat(getComputedStyle(n).lineHeight),
      }));
      assert.ok(
        after.height >= after.line * 3 && after.height <= after.line * 3 + 12,
        JSON.stringify(after),
      );
      return { before, after };
    },
  );
  await check(
    'native editor fills a dynamic host, preserves its draft and keeps a complete fixed row',
    async () => {
      const editor = page.locator('#editable textarea');
      const old = await editor.elementHandle();
      const draft = 'A native draft wraps differently as its container changes. '.repeat(3);
      await editor.fill(draft);
      const heights = [];
      try {
        await set({ minRows: 1, maxRows: 10 });
        for (const width of [360, 180]) {
          await set({ editorWidth: width });
          const size = await editor.evaluate((n) => ({
            width: n.getBoundingClientRect().width,
            root: n.parentElement.getBoundingClientRect().width,
            height: n.clientHeight,
          }));
          assert.ok(Math.abs(size.width - size.root) < 1, JSON.stringify(size));
          assert.equal(await editor.evaluate((n, old) => n === old, old), true);
          assert.equal(await editor.inputValue(), draft);
          heights.push(size.height);
        }
        assert.ok(heights[1] > heights[0], JSON.stringify(heights));
        await set({ autoSize: false });
        const row = await editor.evaluate((n) => ({
          height: n.clientHeight,
          line: parseFloat(getComputedStyle(n).lineHeight),
        }));
        assert.ok(row.height >= row.line, JSON.stringify(row));
      } finally {
        await set({ editorWidth: 240, autoSize: true, minRows: 2, maxRows: 4 });
      }
    },
  );
  await check('editing exposes its actual native root and preserves the root id', async () => {
    assert.equal(
      (await page.evaluate(() => window.typographyAudit.snapshot())).refIsEditRoot,
      true,
    );
    assert.equal(
      await page.locator('#editable > .apollo-typography').getAttribute('id'),
      'edit-identity',
    );
  });
  await check('modifier/newline editing preserves actual multiline content', async () => {
    const editor = page.locator('#editable textarea');
    await editor.fill('First line\nSecond line');
    assert.equal(await editor.inputValue(), 'First line\nSecond line');
  });
  await set({ editing: false });
  await check('owned copy controls are siblings of the native anchor', async () => {
    assert.equal(await page.locator('#owned-link a button').count(), 0);
    assert.equal(await page.locator('#owned-link button.apollo-typography-copy').count(), 1);
  });
  await check('blur saves once without stealing the external destination focus', async () => {
    await set({ editing: true, refuse: false });
    const editor = page.locator('#editable textarea');
    const before = (await page.evaluate(() => window.typographyAudit.snapshot())).saves;
    await editor.fill('Blur saved draft');
    await page.locator('#before-text').click();
    assert.equal(await editor.count(), 0);
    assert.equal(
      await page.locator('#before-text').evaluate((n) => document.activeElement === n),
      true,
    );
    const after = await page.evaluate(() => window.typographyAudit.snapshot());
    assert.equal(after.saves, before + 1);
    assert.equal(after.saved, 'Blur saved draft');
  });
  await check(
    'controlled refusal keeps the same editor and Enter requests remain usable',
    async () => {
      await set({ editing: true, refuse: true });
      const editor = page.locator('#editable textarea');
      const handle = await editor.elementHandle();
      await editor.fill('Refused draft');
      const before = (await page.evaluate(() => window.typographyAudit.snapshot())).saves;
      await editor.press('Enter');
      assert.equal(await editor.evaluate((n, old) => n === old, handle), true);
      assert.equal(await editor.inputValue(), 'Refused draft');
      assert.equal(
        (await page.evaluate(() => window.typographyAudit.snapshot())).saves,
        before + 1,
      );
      await set({ refuse: false });
      await editor.press('Enter');
      assert.equal(await editor.count(), 0);
      assert.equal(
        await page
          .locator('#editable button.apollo-typography-edit')
          .evaluate((n) => document.activeElement === n),
        true,
      );
    },
  );
  await check('IME Enter does not submit and accepted Escape returns owned focus', async () => {
    await set({ editing: true, refuse: false });
    const editor = page.locator('#editable textarea');
    const before = (await page.evaluate(() => window.typographyAudit.snapshot())).saves;
    await editor.evaluate((n) => {
      n.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      n.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }),
      );
      n.dispatchEvent(
        new KeyboardEvent('keyup', { key: 'Enter', isComposing: true, bubbles: true }),
      );
      n.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    });
    assert.equal(await editor.count(), 1);
    assert.equal((await page.evaluate(() => window.typographyAudit.snapshot())).saves, before);
    await editor.press('Escape');
    assert.equal(await editor.count(), 0);
    assert.equal(
      await page
        .locator('#editable button.apollo-typography-edit')
        .evaluate((n) => document.activeElement === n),
      true,
    );
  });
  await check(
    'Link editor clicks preserve textbox semantics without activating anchor listeners',
    async () => {
      const before = (await page.evaluate(() => window.typographyAudit.snapshot())).linkClicks;
      await set({ linkEditing: true });
      try {
        const editor = page.locator('#owned-link textarea');
        await editor.click();
        assert.equal(
          (await page.evaluate(() => window.typographyAudit.snapshot())).linkClicks,
          before,
        );
      } finally {
        await set({ linkEditing: false });
      }
    },
  );
  await set({ disabled: true });
  await check('disabled Link blocks navigation and exposes its disabled state', async () => {
    await page.locator('#owned-link a').focus();
    await page.keyboard.press('Enter');
    assert.equal(new URL(page.url()).hash, '');
    assert.equal(await page.locator('#owned-link a').getAttribute('aria-disabled'), 'true');
  });
  await check('text-only editing has a native keyboard entry', async () => {
    await page.locator('#before-text').focus();
    await page.keyboard.press('Tab');
    assert.equal(
      await page.evaluate(
        () =>
          Boolean(document.activeElement?.closest('#text-only')) &&
          document.activeElement?.id !== 'after-text',
      ),
      true,
    );
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('#text-only textarea').count(), 1);
  });
  await set({ measure: false, width: 300, expanded: false });
  await check(
    'JS measurement retains one visible business input, its draft and focus',
    async () => {
      const input = page.getByRole('textbox', { name: 'Measured business draft' });
      const original = await input.elementHandle();
      await input.fill('Measured draft');
      await input.focus();
      await set({ measure: true });
      const inputs = page.locator('#measure input');
      assert.equal(await inputs.count(), 1);
      assert.equal(await inputs.first().evaluate((n, old) => n === old, original), true);
      assert.equal(await inputs.first().inputValue(), 'Measured draft');
      assert.equal(await inputs.first().evaluate((n) => document.activeElement === n), true);
      await set({ width: 380 });
      assert.equal(await inputs.first().evaluate((n, old) => n === old, original), true);
      const lifecycle = await page.evaluate(() => window.typographyAudit.snapshot());
      assert.equal(lifecycle.mounts, 1);
      assert.equal(lifecycle.unmounts, 0);
      return { inputCount: await inputs.count() };
    },
  );
} finally {
  writeFileSync(
    process.env.TYPOGRAPHY_EVIDENCE ?? '/tmp/apollo-typography-browser.json',
    `${JSON.stringify({ results, errors }, null, 2)}\n`,
  );
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
console.log(
  JSON.stringify({
    checks: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed),
    errors,
  }),
);
if (results.some((r) => !r.passed) || errors.length) process.exitCode = 1;
