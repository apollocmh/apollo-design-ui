/** Real Alias consumers and portals, using source or frozen published artifacts. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const repo = path.resolve(
    process.env.THEME_WRITERS_REPO ??
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  ),
  published = process.env.THEME_WRITERS_MODE === 'published',
  realRepo = realpathSync(repo),
  temp = mkdtempSync(path.join(tmpdir(), 'apollo-theme-writers-'));
const aliases = [
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
  replacement: path.join(repo, `packages/${name}/${published ? 'dist/index.mjs' : 'src/index.ts'}`),
}));
aliases.push({
  find: /^vue$/,
  replacement: createRequire(import.meta.url).resolve('vue/dist/vue.runtime.esm-bundler.js'),
});
const packages = [
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
];
const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
  );
const findArtifacts = () =>
  published
    ? packages
        .flatMap((name) => {
          const p = path.join(repo, 'packages', name, 'dist');
          assert.ok(existsSync(p), `Missing frozen published dist ${name}`);
          return walk(p);
        })
        .sort()
    : [];
const artifactFiles = findArtifacts();
const hash = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const artifactHashes = () =>
  Object.fromEntries(findArtifacts().map((p) => [path.relative(repo, p), hash(p)]));
const artifactsBefore = artifactHashes();
const sharp = createRequire(import.meta.url)('sharp');
const results = [],
  errors = [],
  pixelChecks = [],
  evidence = process.env.THEME_WRITERS_EVIDENCE ?? '/tmp/apollo-theme-writers-browser.json';
const check = async (name, run) => {
  try {
    results.push({ name, passed: true, actual: await run() });
  } catch (e) {
    results.push({ name, passed: false, error: e.message });
  }
  console.log(`${results.at(-1).passed ? 'PASS' : 'FAIL'} ${name}`);
};
let browser, server;
try {
  if (published) {
    mkdirSync(path.join(temp, 'node_modules/@apollo-design'), { recursive: true });
    for (const name of packages)
      symlinkSync(
        path.join(repo, 'packages', name),
        path.join(temp, 'node_modules/@apollo-design', name),
        'dir',
      );
    symlinkSync(path.join(repo, 'node_modules/vue'), path.join(temp, 'node_modules/vue'), 'dir');
  } else symlinkSync(path.join(repo, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  const componentStyles = published
    ? "import '@apollo-design/theme/tokens.css';import '@apollo-design/ui/style.css';"
    : `import {getCSSVarDeclarations,getDesignToken} from '@apollo-design/theme';import {genAllStyles} from '${path.join(repo, 'packages/ui/src/style/index.ts')}';const style=document.createElement('style');style.dataset.writerSourceStyles='';style.textContent=getCSSVarDeclarations(getDesignToken())+genAllStyles();document.head.append(style);`;
  writeFileSync(
    path.join(temp, 'index.html'),
    `<!doctype html><html lang="en"><head><meta charset="UTF-8"><link rel="icon" href="data:,"><title>UI theme sources</title></head><body style="margin:0"><div id="app"></div><script type="module">import {createApp} from 'vue';${componentStyles}import Fixture from '${path.join(repo, 'tests/browser/fixtures/ThemeSourceWriters.mjs')}';createApp(Fixture).mount('#app');</script></body></html>`,
  );
  const loaded = new Set();
  const config = {
    root: temp,
    configFile: false,
    logLevel: 'warn',
    plugins: [
      vue(),
      {
        name: 'source-origin-guard',
        moduleParsed(info) {
          const m = info.id.match(/\/packages\/([^/]+)\/(src|dist)\//);
          if (m) {
            assert.equal(
              m[2],
              published ? 'dist' : 'src',
              `Forbidden ${m[2]} module in ${published ? 'published' : 'source'} mode: ${info.id}`,
            );
            const file = realpathSync(info.id.split('?')[0]);
            assert.ok(
              file.startsWith(`${realRepo}/packages/`),
              `Foreign workspace artifact ${file}`,
            );
            loaded.add(file);
          }
        },
      },
    ],
    resolve: { alias: aliases, dedupe: ['vue'] },
    build: { outDir: path.join(temp, 'out'), emptyOutDir: true },
  };
  await build(config);
  assert.ok(loaded.size > 0, 'Expected actual package modules');
  server = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
  page.setDefaultTimeout(7000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]') || m.text().includes('Hydration'))
      errors.push(m.text());
  });
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.dataset.writerFixtureCss = '';
    style.textContent =
      '.writer-css-only{--apollo-font-size:19px;--apollo-font-size-sm:17px;--apollo-control-height:47px;--apollo-padding-xs:13px;--apollo-padding:23px;--apollo-color-text:rgb(12,34,56);}';
    document.addEventListener('DOMContentLoaded', () => document.head.append(style), {
      once: true,
    });
  });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: 'networkidle' });
  assert.equal(await page.locator('style[data-writer-source-styles]').count(), published ? 0 : 1);
  await page.waitForFunction(() => window.themeWriterAudit?.ready);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    for (const a of document
      .getAnimations()
      .filter((a) => !Number.isFinite(a.effect?.getTiming().iterations ?? 1))) {
      a.pause();
      a.currentTime = 300;
    }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
  const scenes = await page.locator('[data-writer-scene]').evaluateAll((ns) =>
    ns.map((scene) => ({
      name: scene.dataset.writerScene,
      targets: Object.fromEntries(
        [...scene.querySelectorAll('[data-writer-family]')].map((host) => {
          const node = host.querySelector(host.dataset.metricSelector);
          if (!node)
            return [
              host.dataset.writerFamily,
              { missing: true, selector: host.dataset.metricSelector },
            ];
          const s = getComputedStyle(node),
            r = node.getBoundingClientRect(),
            kind = host.dataset.metricKind;
          const keys =
            kind === 'gap'
              ? ['columnGap', 'rowGap']
              : kind === 'image'
                ? ['width', 'height', 'borderRadius']
                : kind === 'skeleton'
                  ? ['height', 'backgroundImage', 'borderRadius']
                  : kind === 'spin'
                    ? ['width', 'height', 'color']
                    : [
                        'fontSize',
                        'fontFamily',
                        'color',
                        'lineHeight',
                        'paddingTop',
                        'paddingRight',
                        'paddingBottom',
                        'paddingLeft',
                        'backgroundColor',
                        'borderRadius',
                      ];
          const style = Object.fromEntries(keys.map((k) => [k, s[k]]));
          return [
            host.dataset.writerFamily,
            {
              style,
              width: Math.round(r.width * 1000) / 1000,
              height: Math.round(r.height * 1000) / 1000,
              inlineAliases: {
                font: node.style.getPropertyValue('--apollo-font-size'),
                paddingXS: node.style.getPropertyValue('--apollo-padding-xs'),
              },
            },
          ];
        }),
      ),
    })),
  );
  const scene = (name) => {
    const value = scenes.find((s) => s.name === name);
    assert.ok(value, `${name} exists`);
    return value;
  };
  assert.equal(scenes.length, 11);
  assert.equal(Object.keys(scene('default').targets).length, 20);
  for (const [name, reference] of [
    ['css-no-theme-cp', 'css-only'],
    ['css-empty-tp', 'explicit-default'],
    ['compact-empty-tp', 'explicit-default'],
    ['compact-empty-tp-cp', 'explicit-default'],
    ['compact-empty-cp-theme', 'compact'],
    ['compact-inherit-false', 'explicit-default'],
    ['css-custom-no-metadata', 'explicit-default'],
  ])
    for (const family of Object.keys(scene('default').targets))
      await check(`${family}: ${name} actual paint/geometry == ${reference}`, async () => {
        const a = scene(name).targets[family],
          b = scene(reference).targets[family];
        assert.equal(a.missing, undefined);
        assert.equal(b.missing, undefined);
        assert.deepEqual(a.style, b.style);
        if (!['Space', 'Flex'].includes(family)) {
          assert.ok(Math.abs(a.width - b.width) < 0.1, `width ${a.width} != ${b.width}`);
          assert.ok(Math.abs(a.height - b.height) < 0.1, `height ${a.height} != ${b.height}`);
        }
        return { actual: a, reference: b };
      });
  await check(
    'explicit active default reference has real default fonts, gaps and skeleton height',
    async () => {
      const t = scene('explicit-default').targets;
      assert.equal(t.Button.style.fontSize, '14px');
      assert.equal(t.Tag.style.fontSize, '12px');
      assert.equal(t.Space.style.columnGap, '8px');
      assert.equal(t.Flex.style.columnGap, '8px');
      assert.equal(t.Skeleton.height, 16);
    },
  );
  await check(
    'Flex real CSS-only gap remains 13px under no-theme ConfigProvider and resets to 8px under empty TP',
    async () => {
      assert.equal(scene('css-no-theme-cp').targets.Flex.style.columnGap, '13px');
      assert.equal(scene('css-empty-tp').targets.Flex.style.columnGap, '8px');
    },
  );
  await check(
    'Flex shared fallback activation/reset updates actual no-Provider gap and stays isolated from explicit scopes',
    async () => {
      const bare = page.locator('[data-writer-scene="default"] .apollo-flex'),
        explicit = page.locator('[data-writer-scene="explicit-default"] .apollo-flex');
      await page.evaluate(() =>
        window.writerFallback.set({ token: { paddingXS: 17, padding: 23, paddingLG: 31 } }),
      );
      assert.equal(await bare.evaluate((n) => getComputedStyle(n).columnGap), '17px');
      assert.equal(await explicit.evaluate((n) => getComputedStyle(n).columnGap), '8px');
      await page.evaluate(() => window.writerFallback.set({}));
      assert.equal(await bare.evaluate((n) => getComputedStyle(n).columnGap), '8px');
      assert.equal(await bare.evaluate((n) => n.style.getPropertyValue('--apollo-padding-xs')), '');
    },
  );
  await page.evaluate(() => {
    document.body.style.setProperty('--apollo-font-size', '19px');
    document.body.style.setProperty('--apollo-control-height-lg', '49px');
  });
  const set = async (patch) => {
    await page.evaluate((p) => window.writerPortals.set(p), patch);
    await page.evaluate(() => new Promise(requestAnimationFrame));
  };
  const selectors = {
    tooltip: '.apollo-tooltip',
    popover: '.apollo-popover',
    popconfirm: '.apollo-popconfirm',
    dropdown: '.apollo-dropdown',
    menu: '.apollo-menu-submenu-popup',
    'date-picker': '.apollo-picker-dropdown',
    'range-picker': '.apollo-picker-dropdown',
    select: '.apollo-select-dropdown',
    mentions: '.apollo-mentions-dropdown',
    tour: '.apollo-tour',
    image: '.apollo-image-preview',
    'image-group': '.apollo-image-preview',
    'table-filter': '.apollo-table-filter-dropdown',
  };
  const actualPopup = async (kind) => {
    await set({ kind, active: true, config: {}, open: true, nativeOverride: false });
    await page.locator('[data-source-portals]').scrollIntoViewIfNeeded();
    if (kind === 'mentions') {
      const input = page.getByRole('textbox', { name: 'Source mentions', exact: true });
      await input.fill('@s');
      await input.focus();
      await page.keyboard.press('End');
    }
    if (kind === 'table-filter')
      await page.locator('[data-source-portals] .apollo-table-filter-trigger').click();
    const p = page.locator(selectors[kind]).filter({ visible: true }).last();
    await p.waitFor({ state: 'visible' });
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
          .map((a) => a.finished.catch(() => {})),
      );
    });
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
    );
    await page.waitForFunction(
      (n) => n.getBoundingClientRect().width > 0 && n.getBoundingClientRect().height > 0,
      await p.elementHandle(),
    );
    return p;
  };
  for (const kind of Object.keys(selectors)) {
    let popup;
    await check(`${kind}: explicit empty source reaches real Portal paint`, async () => {
      popup = await actualPopup(kind);
      const value = await popup.evaluate((n) => ({
        connected: n.isConnected,
        outside: !document.querySelector('#app').contains(n),
        font: getComputedStyle(n.querySelector('.apollo-menu') ?? n).fontSize,
        alias: getComputedStyle(n).getPropertyValue('--apollo-font-size').trim(),
        width: n.getBoundingClientRect().width,
        height: n.getBoundingClientRect().height,
      }));
      assert.equal(value.connected, true);
      assert.equal(value.outside, true);
      assert.equal(value.alias, '14px');
      if (!['image', 'image-group'].includes(kind)) assert.equal(value.font, '14px');
      else
        assert.equal(
          await popup
            .locator('.apollo-image-preview-actions')
            .evaluate((n) => getComputedStyle(n).fontSize),
          '18px',
        );
      assert.ok(value.width > 0 && value.height > 0);
      return value;
    });
    if (!popup) continue;
    const original = await popup.elementHandle();
    await check(
      `${kind}: already-open popup follows active data then clears inactive aliases`,
      async () => {
        await set({
          config: {
            token: { fontSize: 24, controlHeightLG: 61 },
            components: { Image: { previewOperationSize: 31 } },
          },
          active: true,
        });
        assert.equal(
          await popup.evaluate((n) =>
            getComputedStyle(n).getPropertyValue('--apollo-font-size').trim(),
          ),
          '24px',
        );
        assert.equal(
          await popup.evaluate(
            (n, kind) =>
              getComputedStyle(
                kind === 'menu'
                  ? n.querySelector('.apollo-menu')
                  : kind.startsWith('image')
                    ? n.querySelector('.apollo-image-preview-actions')
                    : n,
              ).fontSize,
            kind,
          ),
          kind.startsWith('image') ? '31px' : '24px',
        );
        await set({ active: false });
        assert.equal(
          await popup.evaluate((n) =>
            getComputedStyle(n).getPropertyValue('--apollo-font-size').trim(),
          ),
          '19px',
        );
        assert.equal(
          await popup.evaluate(
            (n, kind) =>
              getComputedStyle(
                kind === 'menu'
                  ? n.querySelector('.apollo-menu')
                  : kind.startsWith('image')
                    ? n.querySelector('.apollo-image-preview-actions')
                    : n,
              ).fontSize,
            kind,
          ),
          kind.startsWith('image') ? '18px' : '19px',
        );
        assert.equal(await original.evaluate((n) => n.isConnected), true);
      },
    );
    await check(
      `${kind}: same popup restores explicit defaults after empty reactivation`,
      async () => {
        await set({ active: true, config: {} });
        assert.equal(
          await popup.evaluate((n) =>
            getComputedStyle(n).getPropertyValue('--apollo-font-size').trim(),
          ),
          '14px',
        );
        assert.equal(
          await popup.evaluate(
            (n, kind) =>
              getComputedStyle(
                kind === 'menu'
                  ? n.querySelector('.apollo-menu')
                  : kind.startsWith('image')
                    ? n.querySelector('.apollo-image-preview-actions')
                    : n,
              ).fontSize,
            kind,
          ),
          kind.startsWith('image') ? '18px' : '14px',
        );
        assert.equal(await original.evaluate((n) => n.isConnected), true);
      },
    );
    if (!['table-filter', 'mentions'].includes(kind))
      await check(`${kind}: close/reopen retains current source`, async () => {
        await set({ open: false });
        await set({ open: true });
        const p = page.locator(selectors[kind]).filter({ visible: true }).last();
        await p.waitFor({ state: 'visible' });
        assert.equal(
          await p.evaluate((n) =>
            getComputedStyle(n).getPropertyValue('--apollo-font-size').trim(),
          ),
          '14px',
        );
      });
    await set({ open: false });
  }
  await check('Tooltip native popup style retains final Alias priority', async () => {
    const p = await actualPopup('tooltip');
    await set({ nativeOverride: true });
    assert.equal(await p.evaluate((n) => getComputedStyle(n).fontSize), '21px');
    await set({ nativeOverride: false });
    assert.equal(await p.evaluate((n) => getComputedStyle(n).fontSize), '14px');
  });
  await check(
    'Tooltip Portal container move follows actual destination CSS while source is inactive',
    async () => {
      await page.evaluate(() => {
        const d = document.createElement('div');
        d.id = 'writer-portal-second';
        d.style.setProperty('--apollo-font-size', '31px');
        document.body.append(d);
      });
      const p = page.locator('.apollo-tooltip').filter({ visible: true }).last(),
        original = await p.elementHandle();
      await set({ active: false, destination: 'second' });
      assert.equal(
        await p.evaluate((n) => n.parentElement.closest('#writer-portal-second') !== null),
        true,
      );
      assert.equal(await p.evaluate((n) => getComputedStyle(n).fontSize), '31px');
      assert.equal(await original.evaluate((n) => n.isConnected), true);
      await set({ active: true, config: {} });
      assert.equal(await p.evaluate((n) => getComputedStyle(n).fontSize), '14px');
      await set({ destination: 'body', open: false });
    },
  );
  await check(
    'QRCode static color(srgb) and active rgba background paint identical over actual dark QR pixels',
    async () => {
      for (const name of ['default', 'explicit-default']) {
        const canvas = page.locator(
          `[data-writer-scene="${name}"] [data-writer-family="QRCode"] canvas`,
        );
        await canvas.scrollIntoViewIfNeeded();
        const point = await canvas.evaluate((c) => {
          const ctx = c.getContext('2d'),
            d = ctx.getImageData(0, 0, c.width, c.height).data,
            r = c.getBoundingClientRect();
          for (let y = 4; y < Math.min(32, c.height - 3); y++)
            for (let x = 4; x < Math.min(32, c.width - 3); x++) {
              let dark = true;
              for (let dy = -2; dy <= 2; dy++)
                for (let dx = -2; dx <= 2; dx++) {
                  const i = ((y + dy) * c.width + x + dx) * 4;
                  if (d[i] > 50 || d[i + 1] > 50 || d[i + 2] > 50 || d[i + 3] < 150) dark = false;
                }
              if (dark)
                return {
                  x: r.x + ((x + 0.5) * r.width) / c.width - 0.5,
                  y: r.y + ((y + 0.5) * r.height) / c.height - 0.5,
                  canvasX: x,
                  canvasY: y,
                };
            }
          throw Error('No stable actual dark QR module');
        });
        const png = await page.screenshot({
            clip: { x: point.x, y: point.y, width: 1, height: 1 },
          }),
          rgba = [...(await sharp(png).ensureAlpha().raw().toBuffer())];
        pixelChecks.push({
          scene: name,
          point,
          rgba,
          rawBackground: scene(name).targets.QRCode.style.backgroundColor,
        });
      }
      assert.deepEqual(pixelChecks[0].rgba, pixelChecks[1].rgba);
      assert.ok(pixelChecks[0].rgba[0] < 255 && pixelChecks[0].rgba[0] > 200);
      assert.equal(pixelChecks[0].rgba[3], 255);
      return pixelChecks;
    },
  );
  const artifactsAfter = artifactHashes();
  assert.deepEqual(artifactsAfter, artifactsBefore, 'Frozen dist artifacts changed while read');
  const css = await page.locator('link[rel=stylesheet]').evaluateAll((ns) => ns.map((n) => n.href));
  const report = {
    mode: published ? 'published' : 'source',
    sourceOnly: !published,
    sourceAliases: !published,
    sourceCssInjection: !published,
    fixtureCssOnly: true,
    packageBuilds: false,
    distRead: published,
    distWritten: false,
    browser: browser.version(),
    loadedSourceModules: published ? 0 : loaded.size,
    publishedModules: published ? [...loaded].sort() : [],
    publishedCss: published ? css : [],
    publicCssEntries: published
      ? ['@apollo-design/theme/tokens.css', '@apollo-design/ui/style.css']
      : [],
    publishedCssFingerprints: published
      ? Object.fromEntries(
          ['packages/theme/dist/tokens.css', 'packages/ui/dist/index.css'].map((f) => [
            f,
            hash(path.join(repo, f)),
          ]),
        )
      : {},
    artifactFiles: artifactFiles.length,
    artifactBefore: artifactsBefore,
    artifactAfter: artifactsAfter,
    artifactFingerprintSha256: createHash('sha256')
      .update(JSON.stringify(artifactsBefore))
      .digest('hex'),
    artifactsUnchanged: true,
    scenes,
    results,
    errors,
    pixelChecks,
    readersExited: false,
  };
  writeFileSync(evidence, `${JSON.stringify(report, null, 2)}\n`);
  assert.deepEqual(errors, []);
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  if (server)
    await new Promise((resolve, reject) =>
      server.httpServer.close((e) => (e ? reject(e) : resolve())),
    );
  try {
    const report = JSON.parse(readFileSync(evidence));
    report.readersExited = true;
    writeFileSync(evidence, `${JSON.stringify(report, null, 2)}\n`);
  } catch {}
  rmSync(temp, { recursive: true, force: true });
  console.log('All theme writer readers exited');
}
