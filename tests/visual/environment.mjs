/** The single native pixel-rendering environment; metadata operations do not use this guard. */
import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';

const VERSION = '150.0.7871.125';
const SAMPLES = [
  { font: '16px sans-serif', text: 'Ant Design', width: 84.52799987792969, ascent: 17, descent: 5 },
  {
    font: '12px sans-serif',
    text: 'Happy Working',
    width: 88.55987548828125,
    ascent: 13,
    descent: 4,
  },
];
// This only accommodates numeric serialization of the measured font fingerprint.
// It does not change comparePair's pixel threshold, area threshold or isolation rule.
const METRIC_PRECISION = 1e-6;

function reject(problems, actual) {
  if (problems.length) {
    throw new Error(
      '[Apollo visual environment] Use canonical CI for pixel capture: macOS 15.7.9/24G830 x64, ' +
        `official Chrome for Testing ${VERSION}, WhenScrolling, zh-Hans-CN/zh_CN. ` +
        'Metadata --check/--accept remain available on other hosts. ' +
        `${problems.join('; ')}. Actual: ${JSON.stringify(actual)}`,
    );
  }
}

function nativeProblems(actual) {
  const problems = [];
  if (actual.platform !== 'darwin' || actual.arch !== 'x64')
    problems.push('platform/architecture mismatch');
  if (actual.os.version !== '15.7.9' || actual.os.build !== '24G830')
    problems.push('OS version/build mismatch');
  if (actual.preferences?.AppleShowScrollBars !== 'WhenScrolling')
    problems.push('AppleShowScrollBars mismatch');
  const languages = actual.preferences?.AppleLanguages;
  if (!Array.isArray(languages) || languages.length !== 1 || languages[0] !== 'zh-Hans-CN')
    problems.push('AppleLanguages mismatch');
  if (actual.preferences?.AppleLocale !== 'zh_CN') problems.push('AppleLocale mismatch');
  return problems;
}

export function assertNativeRenderingEnvironment(actual) {
  reject(nativeProblems(actual), actual);
}

export function assertRenderingEnvironment(actual) {
  const problems = nativeProblems(actual);
  if (
    actual.browser.version !== VERSION ||
    actual.browser.product !== `Google Chrome for Testing ${VERSION}`
  )
    problems.push('actual Chrome for Testing mismatch');
  if (actual.probe.documentLang !== 'zh-CN' || actual.probe.devicePixelRatio !== 1)
    problems.push('document language/DPR mismatch');
  if (
    actual.probe.viewport !== 375 ||
    actual.probe.documentClientWidth !== 375 ||
    actual.probe.stageWidth !== 375 ||
    actual.probe.gutter !== 'stable'
  )
    problems.push('native viewport/scrollbar gutter mismatch');
  for (const expected of SAMPLES) {
    const measured = actual.probe.metrics.find(
      (sample) => sample.font === expected.font && sample.text === expected.text,
    );
    if (
      !measured ||
      !Number.isFinite(measured.width) ||
      Math.abs(measured.width - expected.width) > METRIC_PRECISION ||
      measured.fontBoundingBoxAscent !== expected.ascent ||
      measured.fontBoundingBoxDescent !== expected.descent
    )
      problems.push(`native Canvas metric mismatch: ${expected.font} ${expected.text}`);
  }
  reject(problems, actual);
}

function readPreference(name) {
  const result = spawnSync('/usr/bin/defaults', ['read', '-g', name], { encoding: 'utf8' });
  if (result.error) throw result.error;
  const record = {
    exitCode: result.status,
    signal: result.signal,
    stdout: result.stdout,
    stderr: result.stderr,
  };
  if (result.status !== 0 || result.signal) return { value: null, record };
  const value =
    name === 'AppleLanguages'
      ? JSON.parse(
          execFileSync('/usr/bin/plutil', ['-convert', 'json', '-o', '-', '--', '-'], {
            input: result.stdout,
            encoding: 'utf8',
          }),
        )
      : result.stdout.trim();
  return { value, record };
}

export function readNativeRenderingEnvironment() {
  const actual = {
    platform: process.platform,
    arch: process.arch,
    os: { version: null, build: null },
    preferences: {},
    preferenceReads: {},
  };
  if (process.platform !== 'darwin') return actual;
  actual.os.version = execFileSync('/usr/bin/sw_vers', ['-productVersion'], {
    encoding: 'utf8',
  }).trim();
  actual.os.build = execFileSync('/usr/bin/sw_vers', ['-buildVersion'], {
    encoding: 'utf8',
  }).trim();
  for (const name of ['AppleShowScrollBars', 'AppleLanguages', 'AppleLocale']) {
    const { value, record } = readPreference(name);
    actual.preferences[name] = value;
    actual.preferenceReads[name] = record;
  }
  return actual;
}

/** Probe the same native Canvas inputs used by the CI environment preflight. */
export async function readRenderingEnvironment(launched, native) {
  if (!launched.executablePath)
    throw new Error(
      '[Apollo visual environment] Set APOLLO_CHROME_EXECUTABLE to the official canonical CI Chrome for Testing.',
    );
  const { newStablePage, stabilizePage } = await import('./stabilize.mjs');
  const { context, page } = await newStablePage(launched.browser, { width: 375, height: 900 });
  try {
    await page.setContent(`<html lang="zh-CN"><style>
      html,body{margin:0;padding:0}#stage{box-sizing:border-box;width:100%;padding:16px}
      </style><div id="stage">
      <span id="native-sans" style="font:16px sans-serif">Ant Design Happy Working AFFIX</span>
      <span id="native-system" style="font:16px -apple-system">Ant Design Happy Working AFFIX</span>
      </div>`);
    await stabilizePage(page);
    const probe = await page.evaluate((samples) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('A real native Canvas 2D context is required');
      const metrics = samples.map(({ font, text }) => {
        ctx.font = font;
        const measured = ctx.measureText(text);
        return {
          font: ctx.font,
          text,
          width: measured.width,
          fontBoundingBoxAscent: measured.fontBoundingBoxAscent,
          fontBoundingBoxDescent: measured.fontBoundingBoxDescent,
        };
      });
      canvas.width = 300;
      canvas.height = 80;
      ctx.font = '16px sans-serif';
      ctx.fillText('Ant Design', 0, 20);
      ctx.font = '12px sans-serif';
      ctx.fillText('Happy Working', 0, 40);
      return {
        documentLang: document.documentElement.lang,
        devicePixelRatio,
        viewport: innerWidth,
        documentClientWidth: document.documentElement.clientWidth,
        stageWidth: document.querySelector('#stage').getBoundingClientRect().width,
        gutter: getComputedStyle(document.documentElement).scrollbarGutter,
        userAgent: navigator.userAgent,
        metrics,
        canvas: canvas.toDataURL(),
      };
    }, SAMPLES);
    const cdp = await context.newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument');
    const fonts = {};
    for (const name of ['sans', 'system']) {
      const { nodeId } = await cdp.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: `#native-${name}`,
      });
      fonts[name] = (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts;
    }
    const canvasSha256 = crypto
      .createHash('sha256')
      .update(Buffer.from(probe.canvas.split(',')[1], 'base64'))
      .digest('hex');
    delete probe.canvas;
    return {
      ...native,
      browser: {
        version: launched.browser.version(),
        product: execFileSync(launched.executablePath, ['--version'], { encoding: 'utf8' }).trim(),
        channel: launched.channel,
        executablePath: launched.executablePath,
        executableSha256: crypto
          .createHash('sha256')
          .update(fs.readFileSync(launched.executablePath))
          .digest('hex'),
      },
      probe,
      fonts,
      canvasSha256,
    };
  } finally {
    await context.close();
  }
}
