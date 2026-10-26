import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import axe from 'axe-core';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
// This SFC is outside the root tsconfig. Check the real public caller before
// bundling so a runtime-only fixture cannot silently broaden Image's API.
execFileSync(
  process.execPath,
  [
    path.resolve(root, '../../../node_modules/vue-tsc/bin/vue-tsc.js'),
    '--noEmit',
    '-p',
    path.join(root, 'tsconfig.image-interactions.json'),
  ],
  { cwd: path.resolve(root, '../../..'), stdio: 'pipe' },
);
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-interactions-'));
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(5000);
  const issues = [];
  const results = [];
  page.on('pageerror', (error) => issues.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      issues.push(message.text());
  });
  const state = async () =>
    JSON.parse(await page.locator('[data-interaction-state]').textContent());
  const findDialog = async () => {
    await page.waitForFunction(
      () =>
        window.imageInteractionRoot?.querySelector('[role="dialog"]') ||
        document.querySelector('iframe')?.contentDocument?.querySelector('[role="dialog"]') ||
        document.querySelector('[role="dialog"]'),
    );
    const handle = await page.evaluateHandle(
      () =>
        window.imageInteractionRoot?.querySelector('[role="dialog"]') ||
        document.querySelector('iframe')?.contentDocument?.querySelector('[role="dialog"]') ||
        document.querySelector('[role="dialog"]'),
    );
    const element = handle.asElement();
    assert.ok(element);
    return element;
  };
  const click = async (node) => {
    const box = await node.boundingBox();
    assert.ok(box);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  };
  for (const target of ['image', 'group'])
    for (const scenario of [
      'rich',
      'rich-no-origin',
      'cover',
      'progress',
      'frame',
      'shadow-open',
      'shadow-closed',
      'shadow-source',
      'inline',
      'motion',
      'remove-trigger',
      'remove-trigger-rich',
      'remove-trigger-nested',
      'remove-trigger-teleport',
    ]) {
      if (scenario.startsWith('remove-trigger') && target !== 'group') continue;
      const failures = [];
      try {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.goto(
          `${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-interactions&target=${target}&case=${scenario}`,
        );
        await page.waitForFunction(() => document.querySelector('[data-interaction-state]'));
        if (scenario === 'frame')
          await page.waitForFunction(() =>
            document.querySelector('iframe')?.contentDocument?.head.querySelector('style'),
          );
        if (scenario.startsWith('shadow'))
          await page.waitForFunction(() => window.imageInteractionRoot);
        if (scenario === 'rich' || scenario === 'rich-no-origin') {
          const editor = page.getByRole('textbox', { name: 'Thumbnail caption', exact: true });
          await editor.click();
          await editor.fill('Rich draft');
          await editor.press('Space');
          await editor.press('Enter');
          assert.equal(await editor.inputValue(), 'Rich draft ');
          await page.getByRole('button', { name: 'Save thumbnail', exact: true }).click();
          assert.equal((await state()).saved, 1);
          assert.equal(
            (await state()).opened,
            false,
            'native rich controls must not open the image',
          );
        }
        if (scenario === 'cover') {
          await page.getByRole('button', { name: 'Cover save', exact: true }).click();
          assert.equal((await state()).saved, 1);
          assert.equal((await state()).opened, false);
        }
        if (scenario === 'progress') {
          await page
            .getByRole('textbox', { name: 'Progress note', exact: true })
            .fill('Loading draft');
          await page.getByRole('button', { name: 'Cancel loading', exact: true }).click();
          assert.equal((await state()).saved, 1);
          assert.equal((await state()).opened, false);
          await page.addScriptTag({ content: axe.source });
          const violations = await page.evaluate(async () =>
            (await window.axe.run(document.querySelector('main'))).violations.map((issue) => ({
              id: issue.id,
              nodes: issue.nodes.map((node) => node.target),
            })),
          );
          assert.deepEqual(violations, []);
          results.push({ target, scenario, failures });
          continue;
        }
        const triggerHandle = await page.evaluateHandle(
          () =>
            window.imageInteractionSource?.querySelector(
              'button[aria-label="Preview image: Interaction first"],[role="button"][aria-label="Interaction first"],button[aria-label="Interaction first"]',
            ) ||
            document.querySelector(
              'button[aria-label="Preview image: Interaction first"],[role="button"][aria-label="Interaction first"],button[aria-label="Interaction first"]',
            ),
        );
        const trigger = triggerHandle.asElement();
        assert.ok(trigger);
        const triggerBox = await trigger.boundingBox();
        assert.ok(triggerBox);
        if (scenario.startsWith('remove-trigger')) await trigger.focus();
        await page.mouse.click(triggerBox.x + 6, triggerBox.y + 6);
        const dialog = await findDialog();
        const editor = await dialog.$('input[aria-label="Preview caption"]');
        assert.ok(editor);
        await editor.fill('Preview draft');
        await editor.evaluate((node) => node.setSelectionRange(2, 5));
        if (scenario.startsWith('remove-trigger')) {
          await page
            .getByRole('button', { name: 'Remove original thumbnail', exact: true })
            .click();
          await page.waitForFunction(
            () => !document.querySelector('[aria-label="Interaction first"][role="button"]'),
          );
          assert.equal(await trigger.evaluate((node) => node.isConnected), false);
          assert.equal(await editor.inputValue(), 'Preview draft');
          assert.equal(await page.getByRole('dialog').count(), 1);
        }
        assert.equal(
          await dialog.evaluate((node) =>
            node.contains(node.getRootNode().activeElement ?? node.ownerDocument.activeElement),
          ),
          true,
        );
        assert.equal(
          await dialog.evaluate(
            (node) =>
              node.ownerDocument.defaultView.getComputedStyle(node.ownerDocument.body).overflowY,
          ),
          'hidden',
        );
        if (scenario === 'frame' && target === 'group') {
          const previousChanges = (await state()).changes;
          await dialog.evaluate((node) => {
            const native = node.ownerDocument.createElement('input');
            native.setAttribute('aria-label', 'Foreign editor');
            node.append(native);
            native.focus();
          });
          const native = await dialog.$('[aria-label="Foreign editor"]');
          await native.press('ArrowRight');
          assert.equal(
            (await state()).changes,
            previousChanges,
            'a native foreign editor owns its arrow keys',
          );
        }
        if (scenario === 'motion') {
          await page.addScriptTag({ content: axe.source });
          assert.deepEqual(
            await page.evaluate(async () =>
              (await window.axe.run(document.body)).violations.map((issue) => ({
                id: issue.id,
                nodes: issue.nodes.map((node) => node.target),
              })),
            ),
            [],
          );
          const prior = await editor.evaluate((node) => {
            window.previewDraftNode = node;
            return true;
          });
          assert.equal(prior, true);
          for (const expected of [1, 2, 0]) {
            await page.getByRole('button', { name: 'Cycle motion', exact: true }).click();
            assert.equal((await state()).phase, expected);
            assert.equal(
              await editor.evaluate(
                (node) =>
                  node === window.previewDraftNode &&
                  node.value === 'Preview draft' &&
                  node.selectionStart === 2 &&
                  node.selectionEnd === 5,
              ),
              true,
            );
          }
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await page.waitForFunction(() =>
            [...document.querySelectorAll('.apollo-image-progress-wrapper')].every((node) =>
              node
                .getAnimations({ subtree: true })
                .every((animation) => animation.playState !== 'running'),
            ),
          );
          const close = await dialog.$('[aria-label="Close preview"]');
          await click(close);
          await page.waitForFunction(() => !document.querySelector('[role="dialog"]'));
          await page.getByRole('button', { name: 'Open externally', exact: true }).click();
          await findDialog();
          await page.emulateMedia({ reducedMotion: 'no-preference' });
          await page.getByRole('button', { name: 'Cycle motion', exact: true }).click();
          await page.waitForFunction(() =>
            [...document.querySelectorAll('.apollo-image-progress-wrapper')].every((node) =>
              node
                .getAnimations({ subtree: true })
                .every((animation) => animation.playState !== 'running'),
            ),
          );
          const currentDialog = await findDialog();
          await click(await currentDialog.$('[aria-label="Close preview"]'));
        } else {
          const svg = await dialog.$('[aria-label="Preview SVG action"]');
          assert.ok(svg);
          await svg.focus();
          const savedBeforeSvg = (await state()).saved;
          await svg.press('Enter');
          assert.equal((await state()).saved, savedBeforeSvg + 1);
          await dialog.evaluate((node) => {
            const outside = node.ownerDocument.createElement('button');
            node.ownerDocument.body.append(outside);
            outside.focus({ preventScroll: true });
            outside.remove();
          });
          assert.equal(
            await svg.evaluate(
              (node) =>
                (node.getRootNode().activeElement ?? node.ownerDocument.activeElement) === node,
            ),
            true,
            'native SVG focus is remembered when outside focus is refused',
          );
          const focusable = await dialog.$$(
            'button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex="0"]',
          );
          const last = focusable.at(-1);
          assert.ok(last);
          await last.focus();
          await last.press('Tab');
          assert.equal(
            await editor.evaluate(
              (node) =>
                (node.getRootNode().activeElement ?? node.ownerDocument.activeElement) === node,
            ),
            true,
            'native Tab wraps to the first control',
          );
          await editor.press('Shift+Tab');
          assert.equal(
            await last.evaluate(
              (node) =>
                (node.getRootNode().activeElement ?? node.ownerDocument.activeElement) === node,
            ),
            true,
          );
          await dialog.evaluate((node) => {
            node.dispatchEvent(
              new KeyboardEvent('keydown', {
                key: 'Escape',
                isComposing: true,
                bubbles: true,
                composed: true,
                cancelable: true,
              }),
            );
          });
          assert.equal((await state()).opened, true);
          if (scenario === 'shadow-closed' || scenario === 'shadow-source') {
            // axe 4 cannot resolve contexts inside a closed root. Inspect Chrome's
            // actual accessibility tree here; open-root and ordinary mirrors run full axe.
            const session = await page.context().newCDPSession(page);
            const { nodes } = await session.send('Accessibility.getFullAXTree');
            const exposed = nodes.filter((node) => !node.ignored);
            assert.ok(
              exposed.some(
                (node) => node.role?.value === 'dialog' && node.name?.value === 'Interaction first',
              ),
            );
            assert.ok(
              exposed.some(
                (node) => node.role?.value === 'textbox' && node.name?.value === 'Preview caption',
              ),
            );
            assert.ok(
              exposed.some(
                (node) => node.role?.value === 'button' && node.name?.value === 'Close preview',
              ),
            );
            await session.detach();
          } else {
            await page.addScriptTag({ content: axe.source });
            const violations = await dialog.evaluate(async (node) =>
              (await window.axe.run(node)).violations.map((issue) => ({
                id: issue.id,
                nodes: issue.nodes.map((item) => item.target),
              })),
            );
            assert.deepEqual(violations, []);
          }
          await click(await dialog.$('[aria-label="Close preview"]'));
        }
        await page.waitForFunction(
          () =>
            !window.imageInteractionRoot?.querySelector('[role="dialog"]') &&
            !document.querySelector('iframe')?.contentDocument?.querySelector('[role="dialog"]') &&
            !document.querySelector('[role="dialog"]'),
        );
        assert.equal(
          (await state()).opened,
          false,
          'inline close must not reopen through its thumbnail ancestor',
        );
        if (scenario.startsWith('remove-trigger'))
          assert.equal(
            await page
              .getByRole('button', { name: 'Interaction second', exact: true })
              .evaluate((node) => node.ownerDocument.activeElement === node),
            true,
            'removing the opener returns focus to an available registered thumbnail',
          );
        else if (scenario !== 'motion')
          assert.equal(
            await trigger.evaluate(
              (node) =>
                (node.getRootNode().activeElement ?? node.ownerDocument.activeElement) === node,
            ),
            true,
            'close returns to the real trigger',
          );
        assert.equal(
          await page.evaluate(() =>
            [...document.head.querySelectorAll('style')].some((node) =>
              node.textContent?.includes('overflow-y: hidden'),
            ),
          ),
          false,
        );
      } catch (error) {
        failures.push(error.message);
      }
      results.push({
        target,
        scenario,
        failures,
        entry:
          scenario === 'inline'
            ? 'internal Preview inline (two layouts)'
            : 'public Image/PreviewGroup through declared container types',
        accessibility:
          scenario === 'shadow-closed' || scenario === 'shadow-source'
            ? 'Chrome native AX roles/names and real keyboard; axe cannot resolve closed roots'
            : 'full axe and real interaction',
      });
    }
  {
    const failures = [];
    try {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(
        `${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-interactions&case=public-rich`,
      );
      const scope = page.locator('[data-image-rich-preview]');
      const editor = scope.getByRole('textbox', { name: 'Preview thumbnail caption', exact: true });
      await editor.click();
      await editor.fill('Public caption');
      await editor.press('Space');
      await editor.press('Enter');
      assert.equal(await editor.inputValue(), 'Public caption ');
      await scope.getByRole('button', { name: 'Save thumbnail caption', exact: true }).click();
      assert.equal(await scope.locator('[data-image-rich-saved]').textContent(), '1');
      assert.equal(await scope.locator('[data-image-rich-open]').textContent(), 'false');
      const trigger = scope.getByRole('button', {
        name: 'Preview image: Rich preview image',
        exact: true,
      });
      await trigger.focus();
      await trigger.press('Enter');
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Close preview', exact: true })
        .click();
      await page.getByRole('dialog').waitFor({ state: 'detached' });
      await scope.getByRole('button', { name: 'Toggle interactive cover', exact: true }).click();
      await scope.getByRole('button', { name: 'Save cover caption', exact: true }).click();
      assert.equal(await scope.locator('[data-image-rich-saved]').textContent(), '2');
      assert.equal(await scope.locator('[data-image-rich-open]').textContent(), 'false');
      const artwork = page.locator('[data-image-custom-preview]');
      const artworkNote = artwork.getByRole('textbox', {
        name: 'Custom artwork note',
        exact: true,
      });
      await artworkNote.fill('Custom artwork draft');
      await artworkNote.press('Space');
      assert.equal(await artworkNote.inputValue(), 'Custom artwork draft ');
      const artworkAction = artwork.getByRole('button', {
        name: 'Preview image: Custom artwork preview',
        exact: true,
      });
      await artworkAction.focus();
      await artworkAction.press('Enter');
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Close preview', exact: true })
        .click();
      await page.getByRole('dialog').waitFor({ state: 'detached' });
      await page.addScriptTag({ content: axe.source });
      assert.deepEqual(
        await page.evaluate(async () =>
          (await window.axe.run(document.querySelector('main'))).violations.map((issue) => ({
            id: issue.id,
            nodes: issue.nodes.map((node) => node.target),
          })),
        ),
        [],
      );
    } catch (error) {
      failures.push(error.message);
    }
    results.push({ target: 'public-demo', scenario: 'rich-preview-and-cover', failures });
  }
  {
    const failures = [];
    try {
      await page.goto(
        `${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-interactions&case=public-group`,
      );
      const scope = page.locator('[data-image-group-ownership]');
      const opener = scope.getByRole('button', { name: 'Group image 2', exact: true });
      await opener.focus();
      await opener.press('Enter');
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Remove current thumbnail', exact: true })
        .click();
      await opener.waitFor({ state: 'detached' });
      assert.equal(await page.getByRole('dialog').count(), 1);
      assert.equal(await page.locator('.apollo-image-preview-progress').textContent(), '2 / 2');
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Close preview', exact: true })
        .click();
      await page.getByRole('dialog').waitFor({ state: 'detached' });
      assert.equal(
        await scope
          .getByRole('button', { name: 'Group image 1', exact: true })
          .evaluate((node) => node === node.ownerDocument.activeElement),
        true,
      );
      await scope.getByRole('button', { name: 'Reset group', exact: true }).click();
      assert.equal(await scope.locator('[role="button"]').count(), 3);
      await page.addScriptTag({ content: axe.source });
      assert.deepEqual(
        await scope.evaluate(async (node) =>
          (await window.axe.run(node)).violations.map((issue) => issue.id),
        ),
        [],
      );
    } catch (error) {
      failures.push(error.message);
    }
    results.push({ target: 'public-demo', scenario: 'group-opener-removal-and-reset', failures });
  }
  console.log(JSON.stringify({ browser: browser.version(), results, issues }, null, 2));
  assert.deepEqual(issues, []);
  assert.equal(results.filter((result) => result.failures.length).length, 0);
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
