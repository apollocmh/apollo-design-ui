/** SPACE_SOURCE=1 verifies only source JS/CSS. Published mode loads both published JS and CSS. */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, createServer, preview } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const root = path.join(repo, 'tests/browser/fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-space-contracts-'));
const source = process.env.SPACE_SOURCE === '1';
const alias = source
  ? [
      'ui',
      'theme',
      'utils',
      'icons',
      'motion',
      'portal',
      'position',
      'overlay',
      'a11y',
      'virtual-list',
      'form-core',
      'picker',
      'locale',
    ].map((name) => ({
      find: new RegExp(`^@apollo-design/${name}$`),
      replacement: path.join(repo, `packages/${name}/src/index.ts`),
    }))
  : [];
const results = [],
  errors = [];
let browser, server, ssr;
const check = async (name, run) => {
  try {
    results.push({ name, passed: true, actual: await run() });
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
  }
};
const stylePlugin = {
  name: 'space-contract-styles',
  resolveId(id) {
    if (id === 'virtual:space-styles') return '\0space-styles';
  },
  load(id) {
    if (id !== '\0space-styles') return;
    return source
      ? `import { genAllStyles } from ${JSON.stringify(path.join(repo, 'packages/ui/src/style/index.ts'))}; import { getCSSVarDeclarations, getDesignToken } from '@apollo-design/theme'; if(typeof document !== 'undefined'){const style = document.createElement('style'); style.dataset.spaceSourceStyles = ''; style.textContent = getCSSVarDeclarations(getDesignToken()) + genAllStyles(); document.head.append(style);}`
      : "import '@apollo-design/theme/tokens.css'; import '@apollo-design/ui/style.css';";
  },
};
try {
  const config = {
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue(), stylePlugin],
    resolve: { alias },
  };
  await build({
    ...config,
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'SpaceContracts.html') },
    },
  });
  server = await preview({ ...config, build: { outDir }, preview: { host: '127.0.0.1', port: 0 } });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.setDefaultTimeout(6000);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}SpaceContracts.html`);
  await page.waitForFunction(() => Boolean(window.spaceAudit));
  assert.equal(await page.locator('style[data-space-source-styles]').count(), source ? 1 : 0);
  const set = async (value) => {
    await page.evaluate((patch) => window.spaceAudit.set(patch), value);
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
          .map((animation) => animation.finished.catch(() => undefined)),
      );
    });
  };
  for (const mode of ['default', 'dark', 'compact', 'both']) {
    await check(`${mode}: ThemeProvider aliases reach preset gaps and Addon paint`, async () => {
      await set({ theme: mode, custom: true });
      const actual = await page.evaluate(() => ({
        gap: ['small', 'middle', 'large'].map(
          (name) => getComputedStyle(document.querySelector(`#gap-${name}`)).columnGap,
        ),
        color: getComputedStyle(document.querySelector('#addon-outlined-none-false')).color,
        border: getComputedStyle(document.querySelector('#addon-outlined-none-false')).borderColor,
        background: getComputedStyle(document.querySelector('#addon-outlined-none-false'))
          .backgroundColor,
        selector: getComputedStyle(document.querySelector('#real-controls .apollo-select'))
          .backgroundColor,
      }));
      assert.deepEqual(actual, {
        gap: ['19px', '23px', '29px'],
        color: 'rgb(32, 48, 64)',
        border: 'rgb(52, 86, 120)',
        background: 'rgb(222, 232, 242)',
        selector: mode === 'dark' || mode === 'both' ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
      });
      await set({ nativeSelector: true });
      assert.equal(
        await page
          .locator('#real-controls .apollo-select')
          .evaluate((node) => getComputedStyle(node).backgroundColor),
        'rgb(38, 77, 115)',
      );
      await set({ nativeSelector: false });
      return actual;
    });
  }
  for (const mode of ['default', 'dark', 'compact', 'both'])
    await check(
      `${mode}: Addon status and disabled precedence in all forty combinations`,
      async () => {
        await set({ theme: mode, custom: false });
        const actual = await page
          .locator('#addon-matrix .apollo-space-addon')
          .evaluateAll((nodes) =>
            nodes.map((node) => {
              const style = getComputedStyle(node);
              return {
                id: node.id,
                color: style.color,
                borderColor: style.borderColor,
                borderStyle: style.borderStyle,
                borderSides: ['Top', 'Right', 'Bottom', 'Left'].map((side) => ({
                  style: style[`border${side}Style`],
                  width: style[`border${side}Width`],
                  color: style[`border${side}Color`],
                })),
                lineWidth: style.getPropertyValue('--apollo-line-width').trim(),
                lineType: style.getPropertyValue('--apollo-line-type').trim(),
                radius: style.borderRadius,
                background: style.backgroundColor,
                baseColor: style.getPropertyValue('--apollo-color-text').trim(),
                baseBorder: style.getPropertyValue('--apollo-color-border').trim(),
                baseBackground: style
                  .getPropertyValue('--apollo-color-bg-container-disabled')
                  .trim(),
                errorBackground: style.getPropertyValue('--apollo-color-error-bg').trim(),
                warningBackground: style.getPropertyValue('--apollo-color-warning-bg').trim(),
                errorText: style.getPropertyValue('--apollo-color-error-text').trim(),
                warningText: style.getPropertyValue('--apollo-color-warning-text').trim(),
                disabledColor: style.getPropertyValue('--apollo-color-text-disabled').trim(),
                errorColor: style.getPropertyValue('--apollo-color-error').trim(),
                warningColor: style.getPropertyValue('--apollo-color-warning').trim(),
              };
            }),
          );
        for (const item of actual) {
          const disabled = item.id.endsWith('-true');
          const color = disabled
            ? item.disabledColor
            : item.id.includes('-error-')
              ? `color-mix(in srgb,${item.errorText} 50%,${item.baseColor})`
              : item.id.includes('-warning-')
                ? `color-mix(in srgb,${item.warningText} 50%,${item.baseColor})`
                : item.baseColor;
          const filled = item.id.startsWith('addon-filled');
          const borderless = item.id.startsWith('addon-borderless');
          const underlined = item.id.startsWith('addon-underlined');
          const border = filled
            ? disabled
              ? item.baseBorder
              : 'transparent'
            : item.id.includes('-error-')
              ? item.errorColor
              : item.id.includes('-warning-')
                ? item.warningColor
                : item.baseBorder;
          const background =
            borderless || underlined
              ? 'transparent'
              : filled && !disabled && item.id.includes('-error-')
                ? item.errorBackground
                : filled && !disabled && item.id.includes('-warning-')
                  ? item.warningBackground
                  : item.baseBackground;
          const normalized = await page.evaluate(
            (values) =>
              values.map((value) => {
                const element = document.createElement('div');
                element.style.color = value;
                document.body.append(element);
                const current = getComputedStyle(element).color;
                element.remove();
                return current;
              }),
            [color, border, background],
          );
          assert.equal(item.color, normalized[0], item.id);
          assert.equal(item.background, normalized[2], item.id);
          if (borderless) {
            assert.equal(item.borderStyle, 'none', item.id);
            assert.deepEqual(
              item.borderSides.map((side) => side.width),
              ['0px', '0px', '0px', '0px'],
              item.id,
            );
          } else if (underlined) {
            assert.deepEqual(
              item.borderSides.map((side) => side.style),
              ['none', 'none', item.lineType, 'none'],
              item.id,
            );
            assert.deepEqual(
              item.borderSides.map((side) => side.width),
              ['0px', '0px', item.lineWidth, '0px'],
              item.id,
            );
            assert.equal(item.borderSides[2].color, normalized[1], item.id);
            assert.equal(item.radius, '0px', item.id);
          } else assert.equal(item.borderColor, normalized[1], item.id);
        }
        return { combinations: actual.length };
      },
    );
  for (const vertical of [false, true])
    for (const rtl of [false, true]) {
      await check(
        `Addon chain ${vertical ? 'vertical' : 'horizontal'} ${rtl ? 'rtl' : 'ltr'} joins edges and retains outer corners`,
        async () => {
          await set({ vertical, rtl, theme: 'default' });
          const actual = await page
            .locator('#addon-chain .apollo-space-addon')
            .evaluateAll((nodes) =>
              nodes.map((node) => {
                const s = getComputedStyle(node),
                  r = node.getBoundingClientRect();
                return {
                  top: r.top,
                  bottom: r.bottom,
                  left: r.left,
                  right: r.right,
                  radius: [
                    s.borderStartStartRadius,
                    s.borderStartEndRadius,
                    s.borderEndStartRadius,
                    s.borderEndEndRadius,
                  ],
                  marginEnd: s.marginInlineEnd,
                };
              }),
            );
          assert.equal(actual.length, 3);
          assert.deepEqual(actual[1].radius, ['0px', '0px', '0px', '0px']);
          assert.deepEqual(
            actual[0].radius,
            vertical ? ['6px', '6px', '0px', '0px'] : ['6px', '0px', '6px', '0px'],
          );
          assert.deepEqual(
            actual[2].radius,
            vertical ? ['0px', '0px', '6px', '6px'] : ['0px', '6px', '0px', '6px'],
          );
          const delta = vertical
            ? actual[1].top - actual[0].bottom
            : rtl
              ? actual[0].left - actual[1].right
              : actual[1].left - actual[0].right;
          assert.ok(
            Math.abs(delta + 1) < 0.1,
            `shared border overlaps by one line width: ${delta}`,
          );
          assert.deepEqual(
            await page.locator('#addon-single .apollo-space-addon').evaluate((node) => {
              const s = getComputedStyle(node);
              return [
                s.borderStartStartRadius,
                s.borderStartEndRadius,
                s.borderEndStartRadius,
                s.borderEndEndRadius,
              ];
            }),
            ['6px', '6px', '6px', '6px'],
          );
          return actual;
        },
      );
    }
  await check(
    'Addon variants retain editor identity and decorative disabled semantics across current config',
    async () => {
      const input = page.locator('#addon-native-draft');
      await input.fill('Saved addon draft');
      await input.focus();
      const original = await input.elementHandle();
      const patches = [
        {
          addonVariant: 'underlined',
          addonStatus: '',
          addonDisabled: false,
          addonSize: 'middle',
          theme: 'default',
          vertical: false,
          rtl: false,
          addonAlias: true,
        },
        {
          addonVariant: 'underlined',
          addonStatus: 'error',
          addonDisabled: true,
          addonSize: 'small',
          theme: 'dark',
          vertical: true,
          rtl: true,
          addonAlias: false,
        },
        {
          addonVariant: 'borderless',
          addonStatus: 'warning',
          addonDisabled: true,
          addonSize: 'large',
          theme: 'compact',
          vertical: false,
          rtl: true,
        },
        {
          addonVariant: 'filled',
          addonStatus: 'error',
          addonDisabled: true,
          addonSize: 'small',
          theme: 'both',
          vertical: true,
          rtl: false,
        },
        {
          addonVariant: 'outlined',
          addonStatus: 'warning',
          addonDisabled: false,
          addonSize: 'middle',
          theme: 'default',
          vertical: false,
          rtl: false,
        },
        {
          addonVariant: 'underlined',
          addonStatus: 'warning',
          addonDisabled: false,
          addonSize: 'large',
          theme: 'both',
          vertical: true,
          rtl: true,
        },
        {
          addonVariant: 'underlined',
          addonStatus: '',
          addonDisabled: false,
          addonSize: 'middle',
          theme: 'default',
          vertical: false,
          rtl: false,
        },
      ];
      for (const patch of patches) {
        await set(patch);
        assert.equal(
          await input.evaluate(
            (node, before) => node === before && node === document.activeElement,
            original,
          ),
          true,
        );
        assert.equal(await input.inputValue(), 'Saved addon draft');
        assert.equal(
          await input.isEnabled(),
          true,
          'Addon disabled is decorative; the native editor stays enabled',
        );
        const actual = await page.locator('#addon-editor').evaluate((node) => {
          const style = getComputedStyle(node);
          const token = (name) => style.getPropertyValue(`--apollo-${name}`).trim();
          const status = node.classList.contains('apollo-space-addon-status-error')
            ? 'error'
            : node.classList.contains('apollo-space-addon-status-warning')
              ? 'warning'
              : 'border';
          const probe = document.createElement('span');
          probe.style.color = token(status === 'border' ? 'color-border' : `color-${status}`);
          document.body.append(probe);
          const expectedColor = getComputedStyle(probe).color;
          probe.remove();
          return {
            styles: ['Top', 'Right', 'Bottom', 'Left'].map((side) => style[`border${side}Style`]),
            bottomWidth: style.borderBottomWidth,
            bottomColor: style.borderBottomColor,
            lineWidth: token('line-width'),
            lineType: token('line-type'),
            expectedColor,
            invalid: node.getAttribute('aria-invalid'),
            disabled: node.hasAttribute('disabled'),
          };
        });
        assert.equal(actual.invalid, null);
        assert.equal(actual.disabled, false);
        if (patch.addonVariant === 'underlined') {
          assert.deepEqual(actual.styles, ['none', 'none', actual.lineType, 'none']);
          assert.equal(actual.bottomWidth, patch.addonAlias ? '3px' : actual.lineWidth);
          assert.equal(actual.bottomColor, actual.expectedColor);
        } else if (patch.addonVariant === 'borderless')
          assert.deepEqual(actual.styles, ['none', 'none', 'none', 'none']);
      }
      await set({
        addonVariant: 'outlined',
        addonStatus: '',
        addonDisabled: false,
        addonSize: 'middle',
        addonAlias: false,
        theme: 'default',
        vertical: false,
        rtl: false,
      });
      return { transitions: patches.length, retainedEditor: true };
    },
  );
  await check(
    'real controls retain draft, DOM, focus and native selection across theme and direction changes',
    async () => {
      const input = page.getByRole('textbox', { name: 'Business address', exact: true });
      await input.fill('Business draft');
      await input.focus();
      await input.evaluate((node) => node.setSelectionRange(2, 7));
      const original = await input.elementHandle();
      for (const theme of ['dark', 'compact', 'both', 'default']) {
        await set({ theme, vertical: theme === 'compact', rtl: theme === 'both' });
        assert.equal(
          await input.evaluate(
            (node, previous) =>
              node === previous &&
              node === document.activeElement &&
              node.value === 'Business draft' &&
              node.selectionStart === 2 &&
              node.selectionEnd === 7,
            original,
          ),
          true,
        );
      }
    },
  );
  for (const layout of ['Space', 'Compact'])
    await check(
      `${layout}: focused keyed Fragment editors survive reorder and appearance changes`,
      async () => {
        await set({ reversed: false, customPrefix: false });
        const input = page.getByRole('textbox', { name: `${layout} scoped 1`, exact: true });
        const original = await input.elementHandle();
        await input.fill('Keyed business draft');
        await input.focus();
        await input.evaluate((node) => node.setSelectionRange(2, 7));
        for (const reversed of [true, false, true]) {
          await set({ reversed, customPrefix: reversed, rtl: reversed });
          assert.equal(
            await input.evaluate(
              (node, previous) =>
                node === previous &&
                node.value === 'Keyed business draft' &&
                node === document.activeElement &&
                node.selectionStart === 2 &&
                node.selectionEnd === 7,
              original,
            ),
            true,
          );
        }
      },
    );
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const demos = await page.evaluate(() => window.spaceAudit.demos);
  assert.equal(demos.length, 15);
  for (const demo of demos)
    for (const mode of ['default', 'dark', 'compact', 'both'])
      await check(`${demo}/${mode}: real demo render and axe`, async () => {
        await set({ demo, theme: mode, rtl: false, vertical: false });
        const frame = page.locator('#demo');
        assert.ok(await frame.locator('.apollo-space,.apollo-space-compact').count());
        const violations = await frame.evaluate(async (node) =>
          (
            await window.axe.run(node, {
              runOnly: {
                type: 'tag',
                values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
              },
            })
          ).violations.map(({ id, nodes }) => ({
            id,
            nodes: nodes.map((node) => ({ target: node.target, summary: node.failureSummary })),
          })),
        );
        assert.deepEqual(violations, []);
        return { demo, mode };
      });
  await check('real compact demo keyboard and input are functional', async () => {
    await set({ demo: 'compact', theme: 'default' });
    const phone = page.locator('#demo').getByRole('textbox', { name: 'Phone', exact: true });
    await phone.fill('26889999');
    assert.equal(await phone.inputValue(), '26889999');
    const select = page.locator('#demo').getByRole('combobox', { name: 'Province', exact: true });
    await select.focus();
    await select.press('ArrowDown');
    await select.press('Enter');
    await select.press('Escape');
    assert.equal(await select.evaluate((node) => node === document.activeElement), true);
  });
  await check('size demo responds to preset and custom-zero controls', async () => {
    await set({ demo: 'size' });
    await page
      .locator('#demo')
      .getByRole('combobox', { name: 'Space size', exact: true })
      .selectOption('large');
    assert.equal(
      await page
        .locator('#demo .apollo-space')
        .evaluate((node) => getComputedStyle(node).columnGap),
      '24px',
    );
    await page
      .locator('#demo')
      .getByRole('combobox', { name: 'Space size', exact: true })
      .selectOption('customize');
    assert.ok(
      ['normal', '0px'].includes(
        await page
          .locator('#demo .apollo-space')
          .evaluate((node) => getComputedStyle(node).columnGap),
      ),
    );
  });
  ssr = await createServer({ ...config, appType: 'custom', server: { middlewareMode: true } });
  const { Audit } = await ssr.ssrLoadModule(path.join(root, 'SpaceContracts.mjs'));
  for (const mode of ['default', 'dark', 'compact', 'both'])
    await check(`${mode}: SSR/hydration keeps themed DOM and current controls`, async () => {
      const html = await renderToString(createSSRApp(Audit, { mode, custom: true }));
      assert.ok(html.includes('--apollo-padding-xs:19px'));
      const entry = readFileSync(path.join(outDir, 'SpaceContracts.html'), 'utf8');
      await page.route(`**/SpaceContracts.html?hydrate&mode=${mode}`, (route) =>
        route.fulfill({ contentType: 'text/html', body: entry.replace('<!--SPACE_SSR-->', html) }),
      );
      await page.goto(`${server.resolvedUrls.local[0]}SpaceContracts.html?hydrate&mode=${mode}`);
      await page.waitForFunction(() => Boolean(window.spaceAudit));
      assert.equal(await page.evaluate(() => window.spaceHydrated.retained), true);
      assert.equal(
        await page.locator('#gap-small').evaluate((node) => getComputedStyle(node).columnGap),
        '19px',
      );
      const input = page.getByRole('textbox', { name: 'Business address', exact: true });
      const original = await input.elementHandle();
      await input.fill('Hydrated draft');
      await input.focus();
      await set({ theme: 'dark', custom: false, vertical: true });
      assert.equal(
        await input.evaluate(
          (node, previous) =>
            node === previous && node.value === 'Hydrated draft' && document.activeElement === node,
          original,
        ),
        true,
      );
    });
  await check('fixture reports page and Vue errors separately', async () => {
    assert.deepEqual(errors, []);
    return errors;
  });
  const report = { mode: source ? 'source' : 'published-js-and-css', results, errors };
  const evidence =
    process.env.SPACE_EVIDENCE ||
    path.join(repo, `docs/audit/evidence/space-browser-${source ? 'source' : 'published'}.json`);
  writeFileSync(evidence, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        mode: report.mode,
        passed: results.filter((item) => item.passed).length,
        failed: results.filter((item) => !item.passed),
      },
      null,
      2,
    ),
  );
  if (results.some((item) => !item.passed)) process.exitCode = 1;
} finally {
  await browser?.close();
  await server?.httpServer.close();
  await ssr?.close();
  rmSync(outDir, { recursive: true, force: true });
}
