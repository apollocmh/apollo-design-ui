/** Full-contract evidence probe. Reports every scenario before failing unresolved contracts. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import axe from 'axe-core';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-image-contract-audit-'));
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
  page.setDefaultTimeout(10000);
  await page.route('**/audit-broken-*.png', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: 'invalid image bytes' }),
  );
  const issues = [];
  const results = [];
  page.on('pageerror', (error) => issues.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' ||
      (message.type() === 'warning' && message.text().includes('[Vue warn]'))
    )
      issues.push(message.text());
  });
  for (const target of ['image', 'group'])
    for (const scenario of [
      'default',
      'mask',
      'container',
      'step',
      'theme',
      'fallback',
      'srcset-fallback',
      'no-alt',
      'cross-document',
      ...(target === 'image' ? ['focus-foundation'] : []),
      ...(target === 'group' ? ['semantics'] : []),
    ]) {
      await page.goto(
        `${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-contract-audit&target=${target}&case=${scenario}`,
      );
      if (scenario === 'focus-foundation') {
        const frame = page.frameLocator('[data-image-audit-frame]');
        const root = frame.getByRole('dialog', { name: 'Foundation frame focus', exact: true });
        await root.waitFor({ state: 'visible' });
        await root.evaluate((node) => {
          const input = node.ownerDocument.createElement('input');
          input.setAttribute('aria-label', 'Native frame editor');
          node.append(input);
          input.focus();
        });
        await frame.getByRole('button', { name: 'Frame outside', exact: true }).focus();
        const retainedNativeEditor = await frame
          .getByRole('textbox', { name: 'Native frame editor', exact: true })
          .evaluate((node) => node.ownerDocument.activeElement === node);
        assert.equal(
          retainedNativeEditor,
          true,
          'a native foreign-realm input remains the remembered focus target',
        );
        await frame.getByRole('textbox', { name: 'Native frame editor', exact: true }).press('Tab');
        assert.equal(
          await root
            .getByRole('button', { name: 'Foundation inside', exact: true })
            .evaluate((node) => node.ownerDocument.activeElement === node),
          true,
        );
        await root.focus();
        await frame.getByRole('button', { name: 'Frame outside', exact: true }).focus();
        const trapped = await root.evaluate((node) =>
          node.contains(node.ownerDocument.activeElement),
        );
        results.push({
          target: 'utils-focus',
          scenario,
          failures: trapped ? [] : ['owner-document-focus-lock'],
          measure: { trapped },
        });
        continue;
      }
      const trigger = page.locator('[data-image-audit-trigger]');
      let dialog = page.getByRole('dialog');
      await trigger.click({ position: { x: 6, y: 6 } });
      await page.waitForFunction(
        () =>
          document.querySelector('[role="dialog"]') ||
          document
            .querySelector('[data-image-audit-frame]')
            ?.contentDocument?.querySelector('[role="dialog"]'),
      );
      if (
        scenario === 'cross-document' &&
        (await page.frameLocator('[data-image-audit-frame]').getByRole('dialog').count())
      )
        dialog = page.frameLocator('[data-image-audit-frame]').getByRole('dialog');
      await dialog.waitFor({ state: 'visible' });
      const rootNode = await dialog.elementHandle();
      await page.waitForFunction(
        (node) => node && getComputedStyle(node).opacity === '1',
        rootNode,
      );
      await page.waitForFunction((node) => {
        const img = node.querySelector('img');
        return img?.complete;
      }, rootNode);
      const failures = [];
      const measure = await dialog.evaluate((node) => {
        const img = node.querySelector('img');
        const mask = node.querySelector('.apollo-image-preview-mask');
        const hostDocument =
          node.ownerDocument.defaultView?.frameElement?.ownerDocument ?? document;
        const scope = hostDocument.querySelector('[data-image-audit-theme]');
        const group = scope.querySelector('.apollo-image-preview-group');
        return {
          src: img.getAttribute('src'),
          srcSet: img.getAttribute('srcset'),
          width: img.naturalWidth,
          alt: img.getAttribute('alt'),
          name: node.getAttribute('aria-label'),
          zIndex: getComputedStyle(node).zIndex,
          size: getComputedStyle(node.querySelector('.apollo-image-preview-close')).fontSize,
          spotlight: getComputedStyle(node).getPropertyValue('--apollo-color-bg-spotlight').trim(),
          scopeSpotlight: getComputedStyle(scope)
            .getPropertyValue('--apollo-color-bg-spotlight')
            .trim(),
          maskClass: mask.className,
          maskBorder: mask.style.borderTopWidth,
          insideContainer: !!document.querySelector('[data-image-audit-container]')?.contains(node),
          groupClass: group?.className,
          groupBorder: group?.style.borderTopWidth,
          insideFrame: node.ownerDocument !== hostDocument,
          focusInside: node.contains(node.ownerDocument.activeElement),
        };
      });
      if (scenario === 'default' && measure.zIndex !== '1080') failures.push('default-z-index');
      if (
        scenario === 'mask' &&
        (!measure.maskClass.includes('audit-mask-object') ||
          !measure.maskClass.includes('preview-mask-blur') ||
          measure.maskBorder !== '7px')
      )
        failures.push('mask-object');
      if (scenario === 'container' && !measure.insideContainer) failures.push('container');
      if (scenario === 'container') {
        const editor = dialog.getByRole('textbox', { name: 'Cross document note', exact: true });
        await editor.fill('Kept resolver draft');
        await editor.evaluate((node) => node.setSelectionRange(2, 5));
        const original = await editor.elementHandle();
        for (let move = 0; move < 2; move++) {
          await page
            .getByRole('button', { name: 'Update audit configuration', exact: true })
            .click();
          const state = await editor.evaluate(
            (node, original) => ({
              same: node === original,
              focused: node.ownerDocument.activeElement === node,
              value: node.value,
              selection: [node.selectionStart, node.selectionEnd],
            }),
            original,
          );
          if (
            !state.same ||
            !state.focused ||
            state.value !== 'Kept resolver draft' ||
            state.selection.join(',') !== '2,5'
          )
            failures.push(`replacement-resolver-focus-${move}`);
        }
      }
      if (scenario === 'fallback' || scenario === 'srcset-fallback') {
        const thumbnail = await trigger.locator('img').evaluate((img) => ({
          width: img.naturalWidth,
          src: img.getAttribute('src'),
          srcSet: img.getAttribute('srcset'),
        }));
        measure.thumbnail = thumbnail;
        if (!measure.width || !thumbnail.width) failures.push('fallback-resource');
      }
      if (scenario === 'step') {
        await dialog.getByRole('button', { name: 'zoomIn', exact: true }).click();
        const first = JSON.parse(await page.locator('[data-image-audit-state]').textContent())
          .transformed.scale;
        await page.getByRole('button', { name: 'Update audit configuration', exact: true }).click();
        await dialog.getByRole('button', { name: 'zoomIn', exact: true }).click();
        const second = JSON.parse(await page.locator('[data-image-audit-state]').textContent())
          .transformed.scale;
        measure.scales = [first, second];
        if (Math.abs(first - 1.5) > 1e-8 || Math.abs(second - 1.875) > 1e-8)
          failures.push('current-scale-step');
      }
      if (scenario === 'theme' && (measure.spotlight !== '#123456' || measure.size !== '31px'))
        failures.push('provider-theme');
      if (scenario === 'no-alt') {
        await page.addScriptTag({ content: axe.source });
        measure.axe = await dialog.evaluate(async (node) =>
          (await window.axe.run(node)).violations.map(({ id }) => id),
        );
        if (measure.axe.length) failures.push('optional-alt-a11y');
        measure.triggerName = await trigger.getAttribute('aria-label');
        if (!measure.triggerName?.trim()) failures.push('optional-alt-trigger-name');
      }
      if (scenario === 'cross-document') {
        if (!measure.insideFrame) failures.push('cross-document-container');
        else {
          await page
            .frameLocator('[data-image-audit-frame]')
            .getByRole('button', { name: 'Frame outside', exact: true })
            .focus();
          measure.trappedAfterOutsideFocus = await dialog.evaluate((node) =>
            node.contains(node.ownerDocument.activeElement),
          );
          if (!measure.focusInside || !measure.trappedAfterOutsideFocus)
            failures.push('cross-document-focus');
          const editor = dialog.getByRole('textbox', { name: 'Cross document note', exact: true });
          await editor.fill('Kept document draft');
          await editor.evaluate((node) => node.setSelectionRange(2, 5));
          const originalEditor = await editor.elementHandle();
          measure.documentMoves = [];
          for (let move = 1; move <= 3; move++) {
            await page
              .getByRole('button', { name: 'Update audit configuration', exact: true })
              .click();
            const moved =
              move < 3
                ? page.getByRole('dialog')
                : page.frameLocator('[data-image-audit-frame]').getByRole('dialog');
            await moved.waitFor({ state: 'visible' });
            const movedEditor = moved.getByRole('textbox', {
              name: 'Cross document note',
              exact: true,
            });
            const snapshot = await movedEditor.evaluate(
              (node, original) => ({
                same: node === original,
                focused: node.ownerDocument.activeElement === node,
                value: node.value,
                selection: [node.selectionStart, node.selectionEnd],
              }),
              originalEditor,
            );
            measure.documentMoves.push(snapshot);
            if (
              !snapshot.same ||
              !snapshot.focused ||
              snapshot.value !== 'Kept document draft' ||
              snapshot.selection.join(',') !== '2,5'
            )
              failures.push(`cross-document-editor-move-${move}`);
            const outside =
              move < 3
                ? page.getByRole('button', { name: 'Update audit configuration', exact: true })
                : page
                    .frameLocator('[data-image-audit-frame]')
                    .getByRole('button', { name: 'Frame outside', exact: true });
            await outside.focus();
            if (!(await moved.evaluate((node) => node.contains(node.ownerDocument.activeElement))))
              failures.push(`cross-document-lock-move-${move}`);
            await movedEditor.focus();
          }
        }
      }
      if (
        scenario === 'semantics' &&
        (!measure.groupClass.includes('audit-group-root') || measure.groupBorder !== '9px')
      )
        failures.push('group-root-semantics');
      results.push({ target, scenario, failures, measure });
    }
  await page.goto(
    `${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-contract-audit&case=public-mask-demo`,
  );
  await page.addScriptTag({ content: axe.source });
  const demo = page.locator('[data-image-mask-demo]');
  await demo.getByRole('checkbox').check();
  await demo.locator('.apollo-image').click({ position: { x: 6, y: 6 } });
  const demoDialog = page.getByRole('dialog');
  await demoDialog.waitFor({ state: 'visible' });
  const originalDialog = await demoDialog.elementHandle();
  assert.equal(await demo.locator('[data-image-mask-container] [role="dialog"]').count(), 1);
  for (let phase = 0; phase < 3; phase++) {
    await page.waitForFunction(
      (node) => node && getComputedStyle(node).opacity === '1',
      originalDialog,
    );
    const mask = demoDialog.locator('.apollo-image-preview-mask');
    assert.equal((await mask.getAttribute('class')).includes('mask-blur'), phase === 0);
    assert.equal(await mask.isVisible(), phase !== 2);
    const step = phase === 0 ? 0.5 : 0.25;
    assert.equal(await demoDialog.locator('output').textContent(), `Step: ${step}`);
    const violations = await demoDialog.evaluate(
      async (node) => (await window.axe.run(node)).violations,
    );
    assert.deepEqual(violations, [], `public mask demo phase ${phase}: full axe`);
    if (phase < 2)
      await demoDialog
        .getByRole('button', { name: 'Cycle mask and zoom step', exact: true })
        .click();
    assert.equal(
      await demoDialog.evaluate((node, original) => node === original, originalDialog),
      true,
    );
  }
  await demoDialog.getByRole('button', { name: 'Close preview', exact: true }).click();
  await demoDialog.waitFor({ state: 'hidden' });
  results.push({
    target: 'image',
    scenario: 'public-mask-demo',
    failures: [],
    measure: { phases: 3, container: true, axe: true, stableDialog: true },
  });
  await page.goto(
    `${server.resolvedUrls.local[0]}vue-reactivity.html?demo=image-contract-audit&case=public-token-demo`,
  );
  await page.addScriptTag({ content: axe.source });
  for (const target of ['image', 'group']) {
    await page.locator(`[data-token-${target}]`).click({ position: { x: 6, y: 6 } });
    const popup = page.getByRole('dialog');
    await popup.waitFor({ state: 'visible' });
    const original = await popup.elementHandle();
    await page.waitForFunction((node) => getComputedStyle(node).opacity === '1', original);
    const editor = popup.getByRole('textbox', { name: 'Token preview note', exact: true });
    await editor.fill('Kept token draft');
    await editor.evaluate((node) => node.setSelectionRange(2, 5));
    const originalEditor = await editor.elementHandle();
    for (let phase = 0; phase < 3; phase++) {
      await page.waitForFunction(
        (size) =>
          getComputedStyle(document.querySelector('[role="dialog"] .apollo-image-preview-close'))
            .fontSize === size,
        ['31px', '27px', '18px'][phase],
      );
      assert.equal(
        await popup.evaluate((node) => getComputedStyle(node).zIndex),
        ['2000', '2100', '1080'][phase],
      );
      assert.equal(
        await popup
          .locator('.apollo-image-preview-close')
          .evaluate((node) => getComputedStyle(node).fontSize),
        ['31px', '27px', '18px'][phase],
      );
      assert.equal(
        await page
          .locator('[data-image-token-demo] .apollo-image-progress-ink-1')
          .evaluate((node) => getComputedStyle(node).animationDuration),
        ['4s', '2s', '3s'][phase],
      );
      if (target === 'group')
        assert.equal(
          await popup
            .getByRole('button', { name: 'Next image', exact: true })
            .evaluate((node) => getComputedStyle(node).width),
          ['52px', '64px', '40px'][phase],
        );
      const operation = popup.getByRole('button', { name: 'rotateRight', exact: true });
      const operationNode = await operation.elementHandle();
      const normalColor = phase < 2 ? 'rgb(255, 255, 255)' : 'rgba(255, 255, 255, 0.65)';
      const hoverColor = phase < 2 ? 'rgb(250, 219, 20)' : 'rgba(255, 255, 255, 0.85)';
      await page.waitForFunction(({ node, color }) => getComputedStyle(node).color === color, {
        node: operationNode,
        color: normalColor,
      });
      assert.equal(
        await popup
          .getByRole('button', { name: 'zoomOut', exact: true })
          .evaluate((node) => getComputedStyle(node).color),
        phase < 2 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.25)',
      );
      await operation.hover();
      await page.waitForFunction(({ node, color }) => getComputedStyle(node).color === color, {
        node: operationNode,
        color: hoverColor,
      });
      await editor.hover();
      await page.waitForFunction(({ node, color }) => getComputedStyle(node).color === color, {
        node: operationNode,
        color: normalColor,
      });
      assert.deepEqual(
        await popup.evaluate(async (node) => (await window.axe.run(node)).violations),
        [],
        `actual token demo ${target}/${phase}: full axe`,
      );
      await popup.getByRole('button', { name: 'Cycle component tokens', exact: true }).click();
      assert.equal(await popup.evaluate((node, before) => node === before, original), true);
      assert.equal(await editor.evaluate((node, before) => node === before, originalEditor), true);
      assert.equal(await editor.inputValue(), 'Kept token draft');
      assert.deepEqual(
        await editor.evaluate((node) => [node.selectionStart, node.selectionEnd]),
        [2, 5],
      );
      assert.equal(
        await editor.evaluate((node) => node.ownerDocument.activeElement === node),
        true,
      );
    }
    await popup.getByRole('button', { name: 'Close preview', exact: true }).click();
    await popup.waitFor({ state: 'hidden' });
    results.push({
      target,
      scenario: 'public-token-demo',
      failures: [],
      measure: { phases: 3, axe: true, currentAllTokens: true, stableEditor: true },
    });
  }
  console.log(JSON.stringify({ browser: browser.version(), results, issues }, null, 2));
  assert.deepEqual(
    results.filter(({ failures }) => failures.length),
    [],
    'all current declared contract scenarios must be satisfied',
  );
  assert.deepEqual(issues, [], 'no console, Vue or page errors');
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
