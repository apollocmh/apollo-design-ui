/** Published Empty entries in plain Node, without browser globals. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createSSRApp, h, reactive } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { zh_CN } from '../../packages/locale/dist/index.mjs';
import {
  Empty as DeepEmpty,
  PRESENTED_IMAGE_SIMPLE as DeepSimple,
} from '../../packages/ui/dist/empty/index.mjs';
import {
  ConfigProvider,
  Empty,
  PRESENTED_IMAGE_DEFAULT,
  PRESENTED_IMAGE_SIMPLE,
} from '../../packages/ui/dist/index.mjs';

assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
const results = [];
const check = async (name, run) => {
  try {
    await run();
    results.push({ name, passed: true });
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
  }
};
const render = (node) => renderToString(createSSRApp({ render: () => node }));
await check('root/deep/static identity and installation name', async () => {
  assert.equal(Empty, DeepEmpty);
  assert.equal(Empty.name, 'AEmpty');
  assert.equal(Empty.PRESENTED_IMAGE_DEFAULT, PRESENTED_IMAGE_DEFAULT);
  assert.equal(Empty.PRESENTED_IMAGE_SIMPLE, DeepSimple);
  assert.equal(DeepSimple, PRESENTED_IMAGE_SIMPLE);
  assert.equal(typeof Empty.install, 'function');
});
await check('native root attrs, string style and numeric description before mount', async () => {
  const html = await render(
    h(Empty, {
      id: 'server-empty',
      role: 'region',
      'aria-label': 'Empty region',
      style: 'padding:13px',
      description: 0,
    }),
  );
  for (const part of ['id="server-empty"', 'padding:13px', 'aria-label="Empty region"', '>0<'])
    assert.ok(html.includes(part));
});
await check('all complete slots render once and suppress fallback component', async () => {
  let fallback = 0;
  const calls = { image: 0, description: 0, default: 0 };
  const html = await render(
    h(
      Empty,
      {
        image: () => {
          fallback++;
          return h('svg');
        },
        description: 'Old fallback',
      },
      Object.fromEntries(
        Object.keys(calls).map((part) => [
          part,
          () => {
            calls[part]++;
            return [
              h('label', `${part} label`),
              h('input', { 'aria-label': `${part} draft` }),
              h('strong', `${part} tail`),
              0,
            ];
          },
        ]),
      ),
    ),
  );
  assert.deepEqual(calls, { image: 1, description: 1, default: 1 });
  assert.equal(fallback, 0);
  for (const part of Object.keys(calls))
    assert.ok(html.includes(`${part} draft`) && html.includes(`${part} tail`));
  assert.ok(!html.includes('Old fallback'));
});
await check('intentional empty slots leave no empty hosts or defaults', async () => {
  const html = await render(
    h(Empty, {}, { image: () => [], description: () => [false], default: () => [] }),
  );
  for (const part of ['-image', '-description', '-footer', '<svg', 'No data'])
    assert.ok(!html.includes(part));
});
await check('legal empty image data is empty while zero/arrays retain full content', async () => {
  for (const image of [null, false, true, '', []])
    assert.ok(!(await render(h(Empty, { image }))).includes('apollo-empty-image'));
  const html = await render(h(Empty, { image: [h('span', 'Image'), h('strong', 'Tail'), 0] }));
  for (const part of ['Image', 'Tail', '0', 'apollo-empty-image-content'])
    assert.ok(html.includes(part));
  assert.ok((await render(h(Empty, { image: 0 }))).includes('>0<'));
});
await check('current localized artwork and URL alternative before mount', async () => {
  const html = await render(
    h(ConfigProvider, { locale: zh_CN, direction: 'rtl' }, () =>
      h('main', [
        h(Empty),
        h(Empty, { image: PRESENTED_IMAGE_SIMPLE }),
        h(Empty, { image: 'owned.svg', description: 0 }),
      ]),
    ),
  );
  assert.equal((html.match(/<title>暂无数据<\/title>/g) ?? []).length, 2);
  assert.ok(html.includes('alt="暂无数据"') && html.includes('dir="rtl"'));
});
await check('fully transparent current source palette has no nonfinite fills', async () => {
  const zero = 'rgba(0,0,0,0)';
  const html = await render(
    h(
      ConfigProvider,
      {
        theme: {
          token: {
            colorBgContainer: zero,
            colorFill: zero,
            colorFillSecondary: zero,
            colorFillTertiary: zero,
            colorFillQuaternary: zero,
            colorTextQuaternary: zero,
          },
        },
      },
      () => h('main', [h(Empty), h(Empty, { image: PRESENTED_IMAGE_SIMPLE })]),
    ),
  );
  assert.ok(html.includes('#00000000'));
  assert.ok(!/NaN|Infinity/i.test(html));
});
await check(
  'reactive component image preserves caller-owned attributes in both instances',
  async () => {
    const image = reactive({
      render: () => h('svg', { role: 'img', 'aria-label': 'Business artwork' }),
    });
    const html = await render(h('main', [h(Empty, { image }), h(Empty, { image })]));
    assert.equal((html.match(/aria-label="Business artwork"/g) ?? []).length, 2);
  },
);
writeFileSync(
  process.env.EMPTY_SSR_EVIDENCE ?? '/tmp/apollo-empty-ssr.json',
  `${JSON.stringify({ results, browserGlobals: false }, null, 2)}\n`,
);
console.log(`Empty published SSR ${results.filter((r) => r.passed).length}/${results.length}`);
for (const r of results.filter((r) => !r.passed)) console.log(r);
assert.ok(results.every((r) => r.passed));
