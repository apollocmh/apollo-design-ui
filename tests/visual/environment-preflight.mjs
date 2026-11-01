#!/usr/bin/env node
/** Temporary native-environment comparison; the existing visual CLI remains the judge. */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { artifactDigest } from '../../scripts/verification.mjs';
import { checkEntry, imagePath, readManifest } from './baseline-store.mjs';
import { buildCases } from './matrix.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const BASELINES = path.join(HERE, 'baselines/apollo');
const CASES = [
  ['affix', 'basic', 'desktop'],
  ['watermark', 'multi-line', 'desktop'],
  ['watermark', 'image', 'mobile'],
  ['config-provider', 'empty-reset', 'mobile'],
  ['list', 'theme-dark-compact', 'mobile'],
  ['checkbox', 'basic', 'desktop'],
].map(([component, variant, viewport]) => {
  const matches = buildCases({ component, variants: [variant], apollo: true }).filter(
    (item) => item.viewport === viewport,
  );
  assert.equal(matches.length, 1, `${component}/${variant}/${viewport}`);
  return matches[0];
});
const { values } = parseArgs({
  options: {
    check: { type: 'boolean' },
    'report-dir': { type: 'string' },
    help: { type: 'boolean' },
  },
});

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function readPreferences() {
  return Object.fromEntries(
    ['AppleShowScrollBars', 'AppleLanguages', 'AppleLocale'].map((name) => {
      const result = spawnSync('/usr/bin/defaults', ['read', '-g', name], { encoding: 'utf8' });
      return [
        name,
        {
          exitCode: result.status,
          signal: result.signal,
          stdout: result.stdout,
          stderr: result.stderr,
        },
      ];
    }),
  );
}

function writePreference(args) {
  const result = spawnSync('/usr/bin/defaults', ['write', '-g', ...args], { encoding: 'utf8' });
  assert.equal(result.error, undefined, 'Native preference command must start');
  assert.equal(result.signal, null, 'Native preference command must complete');
  assert.equal(result.status, 0, result.stderr);
}

async function probe() {
  const { launchBrowser, newStablePage, stabilizePage } = await import('./stabilize.mjs');
  const launched = await launchBrowser();
  const browser = launched.browser;
  try {
    assert.equal(browser.version(), '150.0.7871.125', 'Use the actual approved Chrome');
    const { context, page } = await newStablePage(browser, { width: 375, height: 900 });
    await page.setContent(`<html lang="zh-CN"><style>
      html,body{margin:0;padding:0}#stage{box-sizing:border-box;width:100%;padding:16px}
      </style><div id="stage">
      <span id="sans" style="font:16px sans-serif">Ant Design Happy Working AFFIX</span>
      <span id="system" style="font:16px -apple-system">Ant Design Happy Working AFFIX</span>
      </div>`);
    await stabilizePage(page);
    const readings = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('A real native Canvas 2D context is required');
      const metrics = [];
      for (const font of ['16px sans-serif', '12px sans-serif']) {
        for (const text of ['Ant Design', 'Happy Working', 'AFFIX']) {
          ctx.font = font;
          const measured = ctx.measureText(text);
          metrics.push({
            font: ctx.font,
            text,
            width: measured.width,
            fontBoundingBoxAscent: measured.fontBoundingBoxAscent,
            fontBoundingBoxDescent: measured.fontBoundingBoxDescent,
          });
        }
      }
      canvas.width = 300;
      canvas.height = 80;
      ctx.font = '16px sans-serif';
      ctx.fillText('Ant Design', 0, 20);
      ctx.font = '12px sans-serif';
      ctx.fillText('Happy Working', 0, 40);
      const scroller = document.createElement('div');
      scroller.style.cssText = 'width:100px;height:100px;overflow:scroll';
      document.body.append(scroller);
      const nativeScrollbarWidth = scroller.offsetWidth - scroller.clientWidth;
      scroller.remove();
      return {
        documentLang: document.documentElement.lang,
        userAgent: navigator.userAgent,
        viewport: innerWidth,
        documentClientWidth: document.documentElement.clientWidth,
        stageWidth: document.querySelector('#stage').getBoundingClientRect().width,
        gutter: getComputedStyle(document.documentElement).scrollbarGutter,
        nativeScrollbarWidth,
        devicePixelRatio,
        metrics,
        canvas: canvas.toDataURL(),
      };
    });
    const cdp = await context.newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument');
    const fonts = {};
    for (const name of ['sans', 'system']) {
      const { nodeId } = await cdp.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: `#${name}`,
      });
      fonts[name] = (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts;
    }
    const canvasSha256 = crypto
      .createHash('sha256')
      .update(Buffer.from(readings.canvas.split(',')[1], 'base64'))
      .digest('hex');
    delete readings.canvas;
    return {
      os: execFileSync('sw_vers', { encoding: 'utf8' }).trim(),
      arch: process.arch,
      browser: browser.version(),
      channel: launched.channel,
      executable: launched.executablePath,
      preferences: readPreferences(),
      fonts,
      canvasSha256,
      ...readings,
    };
  } finally {
    await browser.close();
  }
}

async function phase(name, output) {
  const directory = path.join(output, name);
  fs.mkdirSync(directory, { recursive: true });
  const result = { name, passed: false, probe: await probe(), cases: [] };
  writeJson(path.join(directory, 'probe.json'), result.probe);
  for (const item of CASES) {
    const reportFile = path.join(directory, 'reports', `${item.id.replace('/', '--')}.json`);
    fs.mkdirSync(path.dirname(reportFile), { recursive: true });
    const generated = [
      ['snapshots', imagePath(path.join(HERE, 'snapshots/apollo'), item.id)],
      ['diffs', imagePath(path.join(HERE, 'diff/apollo'), item.id)],
    ];
    // Remove only these generated scratch files, so an earlier phase cannot satisfy a failed render.
    for (const [, file] of generated) fs.rmSync(file, { force: true });
    const args = [
      'tests/visual/apollo.mjs',
      '--component',
      item.component,
      '--variant',
      item.variant,
      '--viewport',
      item.viewport,
      '--report-file',
      reportFile,
      '--no-build',
    ];
    const started = performance.now();
    const child = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8' });
    const log = path.join(directory, `${item.id.replace('/', '--')}.log`);
    fs.writeFileSync(log, `${child.stdout ?? ''}${child.stderr ?? ''}`);
    const report = fs.existsSync(reportFile)
      ? JSON.parse(fs.readFileSync(reportFile, 'utf8'))
      : null;
    const artifacts = [];
    for (const [kind, file] of generated) {
      if (!fs.existsSync(file)) continue;
      const destination = imagePath(path.join(directory, kind), item.id);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(file, destination);
      artifacts.push({ kind, file: destination });
    }
    const passed =
      !child.error &&
      child.status === 0 &&
      child.signal === null &&
      report?.expected === 1 &&
      report.pending === 0 &&
      report.results.length === 1 &&
      report.results[0].id === item.id &&
      report.results[0].verdict === 'PASS' &&
      artifacts.length === 2;
    result.cases.push({
      id: item.id,
      passed,
      command: [process.execPath, ...args],
      exitCode: child.status,
      signal: child.signal,
      error: child.error?.message,
      durationMs: Math.round(performance.now() - started),
      log,
      reportFile,
      artifacts,
    });
  }
  result.passed = result.cases.every((item) => item.passed);
  writeJson(path.join(directory, 'summary.json'), result);
  return result;
}

async function main() {
  if (values.help) {
    console.log(
      'environment-preflight.mjs --check | --report-dir DIR (temporary macOS GitHub runner only)',
    );
    return;
  }
  const baseline = readManifest(BASELINES);
  for (const item of CASES)
    assert.equal(checkEntry(BASELINES, item.id, baseline.entries[item.id]), null, item.id);
  if (values.check) {
    console.log(
      JSON.stringify({ cases: CASES.map((item) => item.id), baselineHashesVerified: true }),
    );
    return;
  }
  assert.equal(
    process.env.GITHUB_ACTIONS,
    'true',
    'Native preference changes require the temporary GitHub runner',
  );
  assert.equal(process.env.RUNNER_OS, 'macOS', 'This diagnostic is for the actual macOS runner');
  assert.ok(values['report-dir'], '--report-dir is required');
  assert.ok(
    process.env.APOLLO_CHROME_EXECUTABLE,
    'The exact approved Chrome executable is required',
  );
  const output = path.resolve(values['report-dir']);
  const summary = {
    passed: false,
    sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: ROOT,
      encoding: 'utf8',
    }).trim(),
    preferenceScope:
      'Only this ephemeral runner user; no font/CSS/threshold/baseline modifications',
    phases: [],
  };
  try {
    summary.packageDigest = artifactDigest(ROOT);
    const { buildSide } = await import('./build.mjs');
    await buildSide('vue', path.join(HERE, '.artifacts/vue'));
    summary.phases.push(await phase('01-native', output));
    writePreference(['AppleShowScrollBars', '-string', 'WhenScrolling']);
    summary.phases.push(await phase('02-overlay-scrollbars', output));
    // The approved Mac's actual native preferences are zh-Hans-CN / zh_CN.
    // This isolates OS language fallback; it does not override CSS or upload/install fonts.
    writePreference(['AppleLanguages', '-array', 'zh-Hans-CN']);
    writePreference(['AppleLocale', '-string', 'zh_CN']);
    summary.phases.push(await phase('03-baseline-native-language', output));
    assert.equal(
      artifactDigest(ROOT),
      summary.packageDigest,
      'SDK artifacts must not change between phases',
    );
    // Preserve the failed intermediate configuration even if a later comparison succeeds.
    summary.passed = summary.phases.slice(1).every((item) => item.passed);
  } catch (error) {
    summary.error = error.message;
  } finally {
    writeJson(path.join(output, 'summary.json'), summary);
    if (!summary.passed) process.exitCode = 1;
  }
}

await main();
