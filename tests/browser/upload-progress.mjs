/** Actual Upload/Progress browser contracts; package build/dist are never written. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const root = mkdtempSync(path.join(tmpdir(), 'apollo-upload-progress-'));
const source = process.env.UPLOAD_PROGRESS_SOURCE === '1';
const stylesheet =
  process.env.UPLOAD_PROGRESS_CSS === 'component'
    ? '@apollo-design/ui/upload/style.css'
    : '@apollo-design/ui/style.css';
const output =
  process.env.UPLOAD_PROGRESS_EVIDENCE ??
  path.join(tmpdir(), `apollo-upload-progress-${source ? 'source' : 'published'}.json`);
const artifactFiles = [
  'packages/theme/dist/tokens.css',
  'packages/ui/dist/index.mjs',
  'packages/ui/dist/index.css',
  'packages/ui/dist/upload/style.css',
  'packages/ui/dist/progress/style.css',
  'packages/ui/dist/button/style.css',
];
const fingerprint = () =>
  Object.fromEntries(
    artifactFiles.map((file) => [
      file,
      createHash('sha256')
        .update(readFileSync(path.join(repo, file)))
        .digest('hex'),
    ]),
  );
const before = fingerprint();
const warnings = [],
  errors = [],
  steps = [],
  checks = [];
let browser,
  server,
  active = 'static';
const fixture = path.join(repo, 'tests/browser/fixtures/UploadProgressContracts.mjs');
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
function check(name, actual, expected) {
  let passed = true;
  try {
    assert.deepEqual(actual, expected);
  } catch {
    passed = false;
  }
  checks.push({ name, actual, expected, passed });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}`);
}
try {
  symlinkSync(path.join(repo, 'node_modules'), path.join(root, 'node_modules'), 'dir');
  writeFileSync(
    path.join(root, 'index.html'),
    `<!doctype html><html lang="en"><head><meta charset="UTF-8"><link rel="icon" href="data:,"><title>Upload progress contracts</title></head><body style="margin:0"><div id="app"></div><script type="module">import '@apollo-design/theme/tokens.css';import '${stylesheet}';import '${fixture}';</script></body></html>`,
  );
  const config = {
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    cacheDir: path.join(root, 'cache'),
    resolve: {
      alias: [
        ...alias,
        {
          find: /^vue$/,
          replacement: createRequire(import.meta.url).resolve(
            'vue/dist/vue.runtime.esm-bundler.js',
          ),
        },
      ],
      dedupe: ['vue'],
    },
    build: { outDir: path.join(root, 'out'), emptyOutDir: true, minify: false },
  };
  await build(config);
  server = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({
    viewport: { width: 1000, height: 1100 },
    deviceScaleFactor: 1,
  });
  page.setDefaultTimeout(6000);
  page.on('pageerror', (error) => errors.push({ step: active, message: error.message }));
  page.on('console', (message) => {
    if (['warning', 'warn'].includes(message.type()) || message.text().includes('[Vue warn]'))
      warnings.push({ step: active, message: message.text() });
    else if (message.type() === 'error') errors.push({ step: active, message: message.text() });
  });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.uploadProgressMounted === true);
  await page.waitForFunction(() =>
    document.querySelector('[data-case="upload-default"] [role="progressbar"]'),
  );
  const snapshot = async (label) => {
    active = label;
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter((animation) => Number.isFinite(animation.effect?.getTiming().iterations ?? 1))
          .map((animation) => animation.finished.catch(() => {})),
      );
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const cases = await page.evaluate(() => {
      const round = (number) => Math.round(number * 1000) / 1000;
      const measure = (element) => {
        if (!element) return null;
        const rect = element.getBoundingClientRect(),
          style = getComputedStyle(element);
        return {
          className: element.getAttribute('class'),
          text: element.textContent.trim(),
          inlineStyle: element.getAttribute('style'),
          rect: { width: round(rect.width), height: round(rect.height) },
          backgroundImage: style.backgroundImage,
          backgroundColor: style.backgroundColor,
          attrs: Object.fromEntries(
            [...element.attributes]
              .filter(
                (attribute) => attribute.name === 'role' || attribute.name.startsWith('aria-'),
              )
              .map((attribute) => [attribute.name, attribute.value]),
          ),
        };
      };
      return [...document.querySelectorAll('[data-case]')].map((section) => {
        const bar = section.querySelector('[role="progressbar"]');
        return {
          name: section.dataset.case,
          bars: section.querySelectorAll('[role="progressbar"]').length,
          root: measure(bar),
          body: measure(bar?.querySelector('[class$="-body"]')),
          rail: measure(bar?.querySelector('[class$="-rail"]')),
          track: measure(bar?.querySelector('[class$="-track"]')),
          indicator: measure(bar?.querySelector('[class*="-indicator"]')),
          customRow: !!section.querySelector('[data-item-slot]'),
        };
      });
    });
    steps.push({ label, cases });
  };
  const invoke = (method, value) =>
    page.evaluate(async ({ method, value }) => window.uploadProgressProbe[method](value), {
      method,
      value,
    });
  await snapshot('static');
  await page.screenshot({ path: `${output.replace(/\.json$/, '')}.png`, fullPage: true });
  await invoke('setProgress', {
    strokeWidth: '4px',
    showInfo: true,
    strokeColor: '#722ed1',
    'aria-label': 'Dynamic config',
    'aria-labelledby': 'config-heading',
  });
  await snapshot('dynamic-all-fields');
  await invoke('setProgress', {
    size: [180, 5],
    showInfo: true,
    strokeColor: { '100%': '#87d068', '0%': '#108ee9' },
  });
  await invoke('patchFile', { percent: 72.25, 'aria-label': 'Dynamic file' });
  await snapshot('dynamic-replace-gradient-size');
  await invoke('setProgress', { size: 'small', strokeWidth: '0.5rem', showInfo: false });
  await snapshot('dynamic-preset-string');
  await invoke('setProgress', undefined);
  await snapshot('dynamic-remove-config');
  const providerTrigger = await page
    .locator('[data-case="upload-provider"] button')
    .first()
    .elementHandle();
  assert.ok(providerTrigger);
  await providerTrigger.focus();
  await invoke('setProvider', {
    upload: {
      progress: {
        size: [160, 3],
        strokeColor: { from: '#108ee9', to: '#87d068' },
        'aria-label': 'New provider',
      },
    },
  });
  await invoke('setDirection', 'rtl');
  await snapshot('provider-replace-rtl');
  check(
    'Provider updates preserve the actual trigger',
    await providerTrigger.evaluate((element) => element.isConnected),
    true,
  );
  check(
    'Provider updates preserve trigger focus',
    await providerTrigger.evaluate((element) => element.ownerDocument.activeElement === element),
    true,
  );
  await invoke('setProvider', {});
  await snapshot('provider-remove');
  await invoke('patchFile', { status: 'done', percent: 100 });
  await snapshot('dynamic-done');
  await invoke('patchFile', { status: 'uploading', percent: 0 });
  await snapshot('dynamic-reupload');
  for (let cycle = 0; cycle < 2; cycle += 1) {
    await invoke('setShow', false);
    await snapshot(`dynamic-hide-${cycle}`);
    await invoke('setShow', true);
    await page.waitForFunction(() =>
      document.querySelector('[data-case="upload-dynamic"] [role="progressbar"]'),
    );
    await snapshot(`dynamic-show-${cycle}`);
    await invoke('setMount', false);
    await snapshot(`dynamic-unmount-${cycle}`);
    await invoke('setMount', true);
    await page.waitForFunction(() =>
      document.querySelector('[data-case="upload-dynamic"] [role="progressbar"]'),
    );
    await snapshot(`dynamic-remount-${cycle}`);
  }
  await invoke('setFile', { uid: 'dynamic', name: 'no-percent.txt', status: 'uploading' });
  await snapshot('dynamic-percent-absent');
  await invoke('patchFile', { percent: 42.5 });
  await snapshot('dynamic-percent-return');
  await page.locator('[data-case="upload-uncontrolled"] input[type="file"]').setInputFiles({
    name: 'request.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('local mock request'),
  });
  await page.waitForFunction(() =>
    document.querySelector('[data-case="upload-uncontrolled"] [role="progressbar"]'),
  );
  await invoke('requestProgress', 63.5);
  await snapshot('uncontrolled-progress');
  await invoke('requestSuccess');
  await snapshot('uncontrolled-done');
  const events = await page.evaluate(() => window.uploadProgressProbe.events);
  const get = (label, name) =>
    steps.find((step) => step.label === label).cases.find((item) => item.name === name);
  const at = (name) => get('static', name);
  const height = (name, expected) =>
    check(`${name} actual rail height`, at(name).rail?.rect.height, expected);
  height('upload-default', 2);
  height('upload-empty-config', 2);
  height('upload-stroke-number', 4);
  height('upload-stroke-string', 4);
  height('upload-stroke-rem', 4);
  height('upload-size-small', 6);
  height('upload-size-default', 8);
  for (const [name, width, thickness] of [
    ['upload-size-number', 24, 24],
    ['upload-size-tuple', 180, 5],
    ['upload-size-priority', 180, 5],
    ['progress-size-number', 24, 24],
    ['progress-size-tuple', 180, 5],
  ]) {
    check(`${name} actual dimensions`, at(name).body?.rect, { width, height: thickness });
  }
  for (const name of [
    'upload-gradient-stops',
    'upload-gradient-from-to',
    'progress-gradient-stops',
  ])
    check(
      `${name} real gradient`,
      at(name).track?.backgroundImage.includes('linear-gradient'),
      true,
    );
  check(
    'showInfo displays current fractional progress',
    at('upload-info-true').indicator?.text,
    '55.5%',
  );
  check('default hides information', at('upload-default').indicator, null);
  check('file accessible name', at('upload-default').root?.attrs['aria-label'], 'File default');
  check(
    'configuration accessible name wins',
    at('upload-aria-precedence').root?.attrs['aria-label'],
    'Config progress',
  );
  check(
    'configuration labelledby wins',
    at('upload-aria-precedence').root?.attrs['aria-labelledby'],
    'config-heading',
  );
  check('Progress fraction', at('progress-aria-fraction').root?.attrs['aria-valuenow'], '55.5');
  check('Upload overflow ARIA', at('upload-percent-overflow').root?.attrs['aria-valuenow'], '100');
  check(
    'Upload overflow track stays within rail',
    at('upload-percent-overflow').track?.rect.width,
    at('upload-percent-overflow').rail?.rect.width,
  );
  check('Upload negative ARIA', at('upload-percent-negative').root?.attrs['aria-valuenow'], '0');
  check('Upload zero track', at('upload-percent-zero').track?.rect.width, 0);
  check(
    'explicit undefined percent means zero',
    at('upload-percent-undefined').root?.attrs['aria-valuenow'],
    '0',
  );
  for (const name of [
    'upload-percent-absent',
    'upload-status-done',
    'upload-status-error',
    'upload-hidden-list',
    'upload-item-slot',
  ])
    check(`${name} omits built-in bar`, at(name).bars, 0);
  for (const suffix of ['picture', 'picture-card', 'picture-circle', 'dragger']) {
    check(`${suffix} one actual bar`, at(`upload-${suffix}`).bars, 1);
    height(`upload-${suffix}`, 4);
  }
  check(
    'custom prefix follows Provider',
    at('upload-custom-prefix').root?.className.split(' ')[0],
    'custom-progress',
  );
  const changed = get('dynamic-replace-gradient-size', 'upload-dynamic');
  check('dynamic numeric size updates body width', changed.body?.rect.width, 180);
  // With showInfo the body also contains the indicator; size height belongs to the rail.
  check('dynamic numeric size clears old CSS string height', changed.rail?.rect.height, 5);
  check(
    'dynamic gradient clears old solid paint',
    changed.track?.backgroundImage.includes('linear-gradient'),
    true,
  );
  check('dynamic fractional value', changed.root?.attrs['aria-valuenow'], '72.25');
  check(
    'removed config aria falls back to file',
    changed.root?.attrs['aria-label'],
    'Dynamic file',
  );
  check('dynamic info uses current value', changed.indicator?.text, '72.25%');
  check(
    'CSS string overrides small preset',
    get('dynamic-preset-string', 'upload-dynamic').rail?.rect.height,
    8,
  );
  check(
    'removed config clears previous CSS string',
    get('dynamic-remove-config', 'upload-dynamic').rail?.rect.height,
    2,
  );
  const provider = get('provider-replace-rtl', 'upload-provider');
  check('Provider replacement updates dimensions', provider.body?.rect.width, 160);
  check('Provider replacement updates thickness', provider.rail?.rect.height, 3);
  check('RTL gradient direction', provider.track?.backgroundImage.includes('to left'), true);
  check(
    'local ARIA still overrides new Provider',
    provider.root?.attrs['aria-label'],
    'Local progress',
  );
  check(
    'removed Provider restores default',
    get('provider-remove', 'upload-provider').rail?.rect.height,
    2,
  );
  for (const step of steps.filter((step) =>
    /dynamic-(done|hide-|unmount-|percent-absent)/.test(step.label),
  ))
    check(`${step.label} removes owned bar`, get(step.label, 'upload-dynamic').bars, 0);
  for (const step of steps.filter((step) =>
    /dynamic-(reupload|show-|remount-|percent-return)/.test(step.label),
  ))
    check(`${step.label} restores one owned bar`, get(step.label, 'upload-dynamic').bars, 1);
  check(
    'uncontrolled request progresses',
    get('uncontrolled-progress', 'upload-uncontrolled').root?.attrs['aria-valuenow'],
    '63.5',
  );
  check(
    'uncontrolled completion hides bar',
    get('uncontrolled-done', 'upload-uncontrolled').bars,
    0,
  );
  check('request events preserve existing payloads', events, [
    { status: 'uploading', percent: 0 },
    { status: 'uploading', percent: 63.5 },
    { status: 'done', percent: 100 },
  ]);
  check(
    '100% uploading stays normal',
    at('upload-percent-hundred').root?.className.includes('status-normal'),
    true,
  );
  check('100% uploading shows numeric info', at('upload-percent-hundred').indicator?.text, '100%');
  await page.evaluate(() => window.uploadProgressProbe.unmount());
  await page.waitForFunction(() => !document.querySelector('[role="progressbar"]'));
  check('no runtime errors', errors, []);
  check('no browser warnings', warnings, []);
  check('published artifacts unchanged while read', fingerprint(), before);
} finally {
  await browser?.close();
  await server?.httpServer.close();
  writeFileSync(
    output,
    `${JSON.stringify(
      {
        source,
        stylesheet,
        checks,
        steps,
        warnings,
        errors,
        artifactBefore: before,
        artifactAfter: fingerprint(),
        readersExited: true,
        packageBuildRun: false,
      },
      null,
      2,
    )}\n`,
  );
  rmSync(root, { recursive: true, force: true });
}
assert.ok(
  checks.length >= 60 && checks.every((item) => item.passed),
  `Upload/Progress browser contracts failed; see ${output}`,
);
