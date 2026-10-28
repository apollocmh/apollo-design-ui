/** Compare public per-component CSS with the full published CSS using real browser states. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import vue from '@vitejs/plugin-vue';
import pixelmatch from 'pixelmatch';
import sharp from 'sharp';
import { build, preview } from 'vite';
import { prepareBreadcrumbVisual } from '../visual/breadcrumb-state.mjs';
import { prepareDescriptionsVisual } from '../visual/descriptions-state.mjs';
import { prepareGridVisual } from '../visual/grid-state.mjs';
import { prepareSpaceVisual } from '../visual/space-state.mjs';
import { launchBrowser, newStablePage, stabilizePage, waitForFonts } from '../visual/stabilize.mjs';
import { prepareTimelineVisual } from '../visual/timeline-state.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const startCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: repository,
  encoding: 'utf8',
}).trim();
const output =
  process.env.COMPONENT_STYLE_ENTRIES_OUTPUT ??
  mkdtempSync(path.join(tmpdir(), 'apollo-component-style-entries-'));
const evidencePath =
  process.env.COMPONENT_STYLE_ENTRIES_EVIDENCE ?? path.join(output, 'evidence.json');
const units = [
  {
    component: 'timeline',
    variants: ['basic', 'horizontal', 'current-provider'],
    prepare: prepareTimelineVisual,
  },
  {
    component: 'breadcrumb',
    variants: ['keyboard-menu', 'no-title-menu', 'current-provider'],
    prepare: prepareBreadcrumbVisual,
  },
  {
    component: 'descriptions',
    variants: ['vertical-bordered', 'current-geometry'],
    prepare: prepareDescriptionsVisual,
  },
  { component: 'grid', variants: ['responsive', 'current-provider'], prepare: prepareGridVisual },
  {
    component: 'space',
    variants: ['native-spacing', 'addon-compact'],
    prepare: prepareSpaceVisual,
  },
];
const viewports = [
  { name: 'mobile', width: 375, height: 1000 },
  { name: 'desktop', width: 1200, height: 1000 },
];
const results = [],
  bundles = [],
  errors = [],
  servers = [];
let browser, fatal;
mkdirSync(output, { recursive: true });
mkdirSync(path.dirname(evidencePath), { recursive: true });
const fingerprints = () =>
  Object.fromEntries(
    [
      '@apollo-design/ui',
      '@apollo-design/ui/style.css',
      '@apollo-design/theme/tokens.css',
      ...units.map(({ component }) => `@apollo-design/ui/${component}/style.css`),
    ].map((specifier) => {
      const file = fileURLToPath(import.meta.resolve(specifier));
      return [
        specifier,
        { file, sha256: createHash('sha256').update(readFileSync(file)).digest('hex') },
      ];
    }),
  );
const before = fingerprints();

async function fixtureBundle(component, mode) {
  mkdirSync(path.join(output, 'bundles'), { recursive: true });
  const root = mkdtempSync(path.join(output, 'bundles', `${component}-${mode}-`)),
    outDir = path.join(root, 'output');
  mkdirSync(root, { recursive: true });
  symlinkSync(path.join(repository, 'node_modules'), path.join(root, 'node_modules'), 'dir');
  const publicCSS = [
    '@apollo-design/theme/tokens.css',
    mode === 'standalone'
      ? `@apollo-design/ui/${component}/style.css`
      : '@apollo-design/ui/style.css',
  ];
  const expectedCSS = publicCSS.map((specifier) => fileURLToPath(import.meta.resolve(specifier)));
  const caseFile =
    component === 'space'
      ? path.join(repository, 'tests/browser/fixtures/ComponentStyleEntriesSpace.mjs')
      : path.join(repository, `tests/visual/render/cases/apollo/${component}.js`);
  writeFileSync(
    path.join(root, 'ComponentStyleEntries.html'),
    '<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Component CSS composition</title><link rel="icon" href="data:,"></head><body><div id="stage"></div><script type="module" src="./ComponentStyleEntries.mjs"></script></body></html>',
  );
  writeFileSync(
    path.join(root, 'ComponentStyleEntries.mjs'),
    [
      ...publicCSS.map((specifier) => `import ${JSON.stringify(specifier)};`),
      "import { createApp } from 'vue';",
      `import cases from ${JSON.stringify(caseFile)};`,
      "const variant = new URLSearchParams(location.search).get('variant');",
      "if (!cases[variant]) throw new Error('Unknown CSS test state: ' + variant);",
      "createApp({ render: cases[variant] }).mount('#stage');",
      `window.componentStyleEntriesReady = { component: ${JSON.stringify(component)}, variant };`,
    ].join('\n'),
  );
  const provenance = {
    component,
    mode,
    publicCSS,
    expectedCSS,
    runtimeSources: [],
    cssModules: [],
    cssAssets: [],
  };
  const guard = {
    name: 'component-style-entries-published-guard',
    generateBundle(_options, bundle) {
      const modules = [...this.getModuleIds()].map((id) => id.replaceAll('\\', '/'));
      provenance.runtimeSources = modules.filter((id) => /\/packages\/[^/]+\/src\//.test(id));
      provenance.cssModules = [
        ...new Set(modules.filter((id) => /\.css(?:$|\?)/.test(id)).map((id) => id.split('?')[0])),
      ].sort();
      provenance.cssAssets = Object.values(bundle)
        .filter((entry) => entry.type === 'asset' && entry.fileName.endsWith('.css'))
        .map((entry) => ({
          file: entry.fileName,
          sha256: createHash('sha256').update(entry.source).digest('hex'),
        }));
      assert.deepEqual(
        provenance.runtimeSources,
        [],
        'Published runtimes must not use implementation source',
      );
      assert.deepEqual(
        provenance.cssModules,
        [...expectedCSS].sort(),
        'Only tokens and the requested public CSS entry may be loaded',
      );
      assert.ok(provenance.cssAssets.length > 0, 'A real CSS asset must be emitted');
      assert.equal(
        modules.some((id) => /SourceStyles|source-styles|virtual:.*styles/.test(id)),
        false,
        'Source-generated style injection is forbidden',
      );
    },
  };
  const config = {
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue(), guard],
    resolve: {
      alias: [
        {
          find: /^@apollo-design\/icons$/,
          replacement: path.join(repository, 'packages/icons/dist/index.mjs'),
        },
      ],
    },
  };
  await build({
    ...config,
    build: {
      outDir,
      emptyOutDir: true,
      chunkSizeWarningLimit: 4096,
      rollupOptions: { input: path.join(root, 'ComponentStyleEntries.html') },
    },
  });
  const server = await preview({
    ...config,
    build: { outDir },
    preview: { host: '127.0.0.1', port: 0 },
  });
  servers.push(server);
  bundles.push(provenance);
  return `${server.resolvedUrls.local[0]}ComponentStyleEntries.html`;
}

async function inspectSnapshot(page) {
  return page.locator('#stage').evaluate((stage) => {
    const properties = [
      'display',
      'position',
      'box-sizing',
      'width',
      'height',
      'min-width',
      'min-height',
      'max-width',
      'max-height',
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'row-gap',
      'column-gap',
      'flex-direction',
      'flex-wrap',
      'flex-grow',
      'flex-shrink',
      'flex-basis',
      'align-items',
      'justify-content',
      'grid-template-columns',
      'direction',
      'color',
      'background-color',
      'background-image',
      'border-top-width',
      'border-right-width',
      'border-bottom-width',
      'border-left-width',
      'border-top-style',
      'border-top-color',
      'border-right-color',
      'border-bottom-color',
      'border-left-color',
      'border-top-left-radius',
      'border-top-right-radius',
      'border-bottom-left-radius',
      'border-bottom-right-radius',
      'font-family',
      'font-size',
      'font-weight',
      'line-height',
      'letter-spacing',
      'text-align',
      'text-decoration-line',
      'box-shadow',
      'outline-style',
      'outline-width',
      'outline-color',
      'outline-offset',
      'opacity',
      'visibility',
      'overflow',
      'transform',
      'z-index',
    ];
    const paint = (node, pseudo) => {
      const computed = getComputedStyle(node, pseudo);
      return Object.fromEntries(
        [...properties, ...(pseudo ? ['content'] : [])].map((name) => [
          name,
          computed.getPropertyValue(name),
        ]),
      );
    };
    const nodes = [stage, ...stage.querySelectorAll('*')].map((node) => {
      const bounds = node.getBoundingClientRect();
      return {
        tag: node.tagName,
        id: node.id || null,
        role: node.getAttribute('role'),
        className: node.getAttribute('class'),
        text: node.children.length ? null : node.textContent,
        rect: [bounds.x, bounds.y, bounds.width, bounds.height].map((value) =>
          Number(value.toFixed(4)),
        ),
        scroll: [node.scrollWidth, node.scrollHeight],
        value: node instanceof HTMLInputElement ? node.value : null,
        focused: node === document.activeElement,
        paint: paint(node),
        before: paint(node, '::before'),
        after: paint(node, '::after'),
      };
    });
    return {
      nodes,
      hash: location.hash,
      activeTag: document.activeElement?.tagName,
      width: stage.clientWidth,
      height: stage.clientHeight,
    };
  });
}

function nodeDifferences(standalone, full) {
  const differences = [];
  for (let index = 0; index < Math.max(standalone.nodes.length, full.nodes.length); index++) {
    const left = standalone.nodes[index],
      right = full.nodes[index];
    if (!left || !right) {
      differences.push({ index, standalone: left ?? null, full: right ?? null });
      continue;
    }
    const changes = [];
    for (const field of Object.keys(left)) {
      if (['paint', 'before', 'after'].includes(field)) {
        for (const property of Object.keys(left[field]))
          if (!isDeepStrictEqual(left[field][property], right[field]?.[property]))
            changes.push({
              field: `${field}.${property}`,
              standalone: left[field][property],
              full: right[field]?.[property],
            });
      } else if (!isDeepStrictEqual(left[field], right[field])) {
        changes.push({ field, standalone: left[field], full: right[field] });
      }
    }
    if (changes.length)
      differences.push({
        index,
        tag: left.tag,
        id: left.id,
        className: left.className,
        text: left.text,
        changes,
      });
  }
  return differences;
}

async function interact(page, component, variant) {
  if (component === 'breadcrumb' && ['keyboard-menu', 'no-title-menu'].includes(variant)) {
    const trigger = page.getByRole('button', { name: 'Open breadcrumb menu' });
    const item = page.getByRole('menuitem', { name: 'New product' });
    const destination = new URL(page.url());
    destination.hash = '#products/new';
    await item.press('Enter');
    await page.waitForURL(destination.href);
    await item.waitFor({ state: 'hidden' });
    await trigger.press('ArrowDown');
    await item.waitFor({ state: 'visible' });
    await page.keyboard.press('Escape');
    await item.waitFor({ state: 'hidden' });
    assert.equal(await trigger.evaluate((node) => document.activeElement === node), true);
    await trigger.press('ArrowDown');
    await item.waitFor({ state: 'visible' });
    await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'menuitem');
  }
  if (component === 'space') {
    assert.equal(
      await page.locator('.apollo-btn,.apollo-input,.apollo-select,.apollo-divider').count(),
      0,
      'Space slots in this test contain native controls or Addon only',
    );
    const input = page.locator('#space-entry-draft'),
      previous = await input.elementHandle();
    await input.fill('Retained native draft');
    await input.focus();
    await page.evaluate(() => window.componentStyleEntriesSpace.update());
    assert.equal(
      await input.evaluate(
        (node, old) => node === old && document.activeElement === node,
        previous,
      ),
      true,
    );
    assert.equal(await input.inputValue(), 'Retained native draft');
    if (variant === 'native-spacing') {
      const geometry = await page.locator('#space-entry-native').evaluate((node) => ({
        display: getComputedStyle(node).display,
        direction: getComputedStyle(node).flexDirection,
        gap: getComputedStyle(node).rowGap,
      }));
      assert.deepEqual(geometry, { display: 'inline-flex', direction: 'column', gap: '24px' });
      assert.equal(await page.locator('.apollo-space-item-separator').count(), 2);
    } else {
      assert.equal(await page.locator('.apollo-space-addon').count(), 3);
      const paint = await page
        .locator('.apollo-space-addon')
        .first()
        .evaluate((node) => ({
          fontSize: getComputedStyle(node).fontSize,
          border: getComputedStyle(node).borderTopWidth,
          direction: getComputedStyle(node).direction,
        }));
      // Addon has natural content height; large sets its font and corner size.
      assert.deepEqual(paint, { fontSize: '16px', border: '1px', direction: 'rtl' });
    }
  }
}

async function renderState(unit, variant, viewport, mode, url) {
  const { page, context } = await newStablePage(browser, viewport);
  const label = `${unit.component}/${variant}/${viewport.name}/${mode}`;
  page.setDefaultTimeout(5000);
  page.on('pageerror', (error) => errors.push({ label, message: error.message }));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push({ label, message: message.text() });
  });
  try {
    await page.goto(`${url}?variant=${encodeURIComponent(variant)}`);
    await page.waitForFunction(() => Boolean(window.componentStyleEntriesReady));
    assert.equal(
      await page.locator('style').count(),
      0,
      'Published fixture does not inject generated component CSS',
    );
    assert.ok(await page.locator('link[rel="stylesheet"]').count());
    await waitForFonts(page);
    const stableStyles = await page.locator('style').allTextContents();
    const initial = await inspectSnapshot(page);
    const helperState = await unit.prepare(page, variant);
    await interact(page, unit.component, variant);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((animation) => Number.isFinite(animation.effect?.getTiming().iterations ?? 1))
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
    await page.waitForFunction(() =>
      [...document.querySelectorAll('#stage [class]')].every((node) =>
        [...node.classList].every(
          (name) => !/-(enter|appear|leave)(-(active|prepare|start|end))?$/.test(name),
        ),
      ),
    );
    if (unit.component === 'breadcrumb' && ['keyboard-menu', 'no-title-menu'].includes(variant)) {
      const popup = page.getByRole('menu');
      assert.equal(
        await popup.isVisible(),
        true,
        'Actual keyboard popup remains visible after its motion',
      );
      assert.ok(await popup.evaluate((node) => node.getBoundingClientRect().height > 0));
    }
    assert.deepEqual(
      await page.locator('style').allTextContents(),
      stableStyles,
      'Helpers must not inject source styles',
    );
    // Let real popup transitions finish before disabling motion for the static capture.
    await stabilizePage(page, { preserveFocus: true });
    const final = await inspectSnapshot(page);
    assert.ok(
      final.nodes.length > 3 && final.width > 200 && final.height > 30,
      'Real component content is visible',
    );
    const pngPath = path.join(output, `${unit.component}-${variant}-${viewport.name}-${mode}.png`);
    const png = await page.locator('#stage').screenshot({ path: pngPath, animations: 'disabled' });
    const decoded = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const snapshotPath = pngPath.replace(/\.png$/, '.json');
    writeFileSync(snapshotPath, `${JSON.stringify({ initial, final, helperState }, null, 2)}\n`);
    return {
      initial,
      final,
      helperState,
      pngPath,
      snapshotPath,
      rgba: decoded.data,
      image: decoded.info,
    };
  } catch (error) {
    const failure = path.join(
      output,
      `${unit.component}-${variant}-${viewport.name}-${mode}-failure.png`,
    );
    await page.screenshot({ path: failure, fullPage: true });
    error.message = `${label}: ${error.message}; screenshot=${failure}`;
    throw error;
  } finally {
    await context.close();
  }
}

try {
  const urls = new Map();
  for (const unit of units) {
    const modes = {};
    for (const mode of ['standalone', 'full'])
      modes[mode] = await fixtureBundle(unit.component, mode);
    urls.set(unit.component, modes);
  }
  ({ browser } = await launchBrowser());
  for (const unit of units)
    for (const variant of unit.variants)
      for (const viewport of viewports) {
        const result = {
          component: unit.component,
          variant,
          viewport: viewport.name,
          passed: false,
        };
        try {
          const standalone = await renderState(
            unit,
            variant,
            viewport,
            'standalone',
            urls.get(unit.component).standalone,
          );
          const full = await renderState(
            unit,
            variant,
            viewport,
            'full',
            urls.get(unit.component).full,
          );
          result.screenshots = { standalone: standalone.pngPath, full: full.pngPath };
          result.snapshots = { standalone: standalone.snapshotPath, full: full.snapshotPath };
          result.initialEqual = isDeepStrictEqual(standalone.initial, full.initial);
          result.helperEqual = isDeepStrictEqual(standalone.helperState, full.helperState);
          result.finalEqual = isDeepStrictEqual(standalone.final, full.final);
          result.differences = {
            initial: nodeDifferences(standalone.initial, full.initial),
            final: nodeDifferences(standalone.final, full.final),
          };
          assert.deepEqual(standalone.image, full.image, 'Same screenshot dimensions and channels');
          if (!standalone.rgba.equals(full.rgba)) {
            const diff = Buffer.alloc(standalone.rgba.length);
            result.differingPixels = pixelmatch(
              standalone.rgba,
              full.rgba,
              diff,
              standalone.image.width,
              standalone.image.height,
              { threshold: 0, includeAA: true },
            );
            result.diff = path.join(
              output,
              `${unit.component}-${variant}-${viewport.name}-diff.png`,
            );
            await sharp(diff, {
              raw: { width: standalone.image.width, height: standalone.image.height, channels: 4 },
            })
              .png()
              .toFile(result.diff);
          }
          assert.equal(
            result.initialEqual,
            true,
            'Initial real geometry/paint differs between public CSS modes; see paired snapshots',
          );
          assert.equal(result.helperEqual, true, 'Same actual component helper state');
          assert.equal(
            result.finalEqual,
            true,
            'Post-interaction geometry/paint differs between public CSS modes; see paired snapshots',
          );
          assert.equal(
            standalone.rgba.equals(full.rgba),
            true,
            'Every raw screenshot RGBA byte must match',
          );
          result.passed = true;
          result.rgbaSha256 = createHash('sha256').update(standalone.rgba).digest('hex');
          result.nodes = standalone.final.nodes.length;
        } catch (error) {
          result.error = error.message;
        }
        results.push(result);
        console.log(
          `${result.passed ? 'PASS' : 'FAIL'} ${unit.component}/${variant}/${viewport.name}${result.error ? `: ${result.error}` : ''}`,
        );
      }
} catch (error) {
  fatal = error.message;
} finally {
  await browser?.close();
  for (const server of servers) await server.close();
  const after = fingerprints();
  const distUnchanged = JSON.stringify(before) === JSON.stringify(after);
  const expectedPairs = units.reduce(
    (count, unit) => count + unit.variants.length * viewports.length,
    0,
  );
  const report = {
    startCommit,
    commit: execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repository,
      encoding: 'utf8',
    }).trim(),
    publishedOnly: true,
    comparisonPurpose:
      'Detect disagreements between public CSS entry choices; neither mode is automatically the accepted specification.',
    bundles,
    units: units.map(({ component, variants }) => ({ component, variants })),
    expectedPairs,
    comparedPairs: results.length,
    passedPairs: results.filter((result) => result.passed).length,
    errors,
    fatal,
    distUnchanged,
    fingerprints: before,
    results,
    passed:
      !fatal &&
      distUnchanged &&
      errors.length === 0 &&
      results.length === expectedPairs &&
      results.every((result) => result.passed),
  };
  writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `${report.passed ? 'PASS' : 'FAIL'} public CSS composition ${report.passedPairs}/${expectedPairs}; ${evidencePath}`,
  );
  assert.equal(
    report.passed,
    true,
    fatal ?? `Component public CSS differs from full CSS; see ${evidencePath}`,
  );
}
