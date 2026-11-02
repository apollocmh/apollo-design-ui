import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertNativeRenderingEnvironment,
  assertRenderingEnvironment,
} from '../visual/environment.mjs';

// Actual values from the successful native-language probe in CI 41322884353.
function canonical() {
  return {
    platform: 'darwin',
    arch: 'x64',
    os: { version: '15.7.9', build: '24G830' },
    preferences: {
      AppleShowScrollBars: 'WhenScrolling',
      AppleLanguages: ['zh-Hans-CN'],
      AppleLocale: 'zh_CN',
    },
    browser: { version: '150.0.7871.125', product: 'Google Chrome for Testing 150.0.7871.125' },
    probe: {
      documentLang: 'zh-CN',
      devicePixelRatio: 1,
      viewport: 375,
      documentClientWidth: 375,
      stageWidth: 375,
      gutter: 'stable',
      metrics: [
        {
          font: '16px sans-serif',
          text: 'Ant Design',
          width: 84.52799987792969,
          fontBoundingBoxAscent: 17,
          fontBoundingBoxDescent: 5,
        },
        {
          font: '12px sans-serif',
          text: 'Happy Working',
          width: 88.55987548828125,
          fontBoundingBoxAscent: 13,
          fontBoundingBoxDescent: 4,
        },
      ],
    },
  };
}

test('the actual canonical CI profile passes without changing its values', () => {
  const actual = canonical();
  const original = structuredClone(actual);
  assert.doesNotThrow(() => assertNativeRenderingEnvironment(actual));
  assert.doesNotThrow(() => assertRenderingEnvironment(actual));
  assert.deepEqual(actual, original);
});

test('the approved legacy metadata signature does not admit Mac12 or a different native OS build', () => {
  for (const os of [
    { version: '12.7.6', build: '21H1320' },
    { version: '15.7.9', build: '24G831' },
  ]) {
    const actual = canonical();
    actual.os = os;
    assert.throws(
      () => assertNativeRenderingEnvironment(actual),
      /Use canonical CI.*OS version\/build mismatch/,
    );
  }
  for (const [field, value] of [
    ['platform', 'linux'],
    ['arch', 'arm64'],
  ]) {
    const actual = canonical();
    actual[field] = value;
    assert.throws(
      () => assertNativeRenderingEnvironment(actual),
      /platform\/architecture mismatch/,
    );
  }
});

test('classic scrolling and English/mixed native language preferences reject before rendering', () => {
  for (const [field, value] of [
    ['AppleShowScrollBars', null],
    ['AppleShowScrollBars', 'Always'],
    ['AppleLanguages', ['en']],
    ['AppleLanguages', ['zh-Hans-CN', 'en']],
    ['AppleLocale', 'en_US'],
  ]) {
    const actual = canonical();
    actual.preferences[field] = value;
    assert.throws(() => assertNativeRenderingEnvironment(actual), new RegExp(`${field} mismatch`));
  }
});

test('a same-number system Chrome and a different actual browser version do not impersonate approved CfT', () => {
  const actual = canonical();
  actual.browser.product = 'Google Chrome 150.0.7871.125';
  assert.throws(() => assertRenderingEnvironment(actual), /actual Chrome for Testing mismatch/);
  actual.browser.product = 'Google Chrome for Testing 150.0.7871.125';
  actual.browser.version = '150.0.7871.126';
  assert.throws(() => assertRenderingEnvironment(actual), /actual Chrome for Testing mismatch/);
});

test('the known15px gutter and DPR/document language drift reject', () => {
  for (const [field, value] of [
    ['documentClientWidth', 360],
    ['stageWidth', 360],
    ['devicePixelRatio', 2],
    ['documentLang', 'en'],
  ]) {
    const actual = canonical();
    actual.probe[field] = value;
    assert.throws(
      () => assertRenderingEnvironment(actual),
      /gutter mismatch|language\/DPR mismatch/,
    );
  }
});

test('both known English and legacy Mac12 Canvas widths fail despite identical browser metadata', () => {
  for (const width of [78.265625, 81.21589660644531]) {
    const actual = canonical();
    actual.probe.metrics[0].width = width;
    assert.throws(
      () => assertRenderingEnvironment(actual),
      /Canvas metric mismatch: 16px sans-serif Ant Design/,
    );
  }
  const actual = canonical();
  actual.probe.metrics[1].width = 85.15191650390625;
  assert.throws(
    () => assertRenderingEnvironment(actual),
    /Canvas metric mismatch: 12px sans-serif Happy Working/,
  );
});

test('missing/nonfinite metrics and font bounding-box drift cannot silently pass', () => {
  for (const change of [
    (actual) => {
      actual.probe.metrics.pop();
    },
    (actual) => {
      actual.probe.metrics[0].width = Number.NaN;
    },
    (actual) => {
      actual.probe.metrics[0].fontBoundingBoxDescent = 4;
    },
  ]) {
    const actual = canonical();
    change(actual);
    assert.throws(() => assertRenderingEnvironment(actual), /Canvas metric mismatch/);
  }
});

test('font fingerprint numeric precision permits serialization rounding, not glyph-width drift', () => {
  const actual = canonical();
  actual.probe.metrics[0].width = 84.5279998779;
  actual.probe.metrics[1].width = 88.5598754883;
  assert.doesNotThrow(() => assertRenderingEnvironment(actual));
  actual.probe.metrics[0].width += 0.001;
  assert.throws(() => assertRenderingEnvironment(actual), /Canvas metric mismatch/);
});
