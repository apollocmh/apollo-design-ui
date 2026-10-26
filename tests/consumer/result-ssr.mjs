/** Validate the published Result entry in plain Node, without browser globals. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
  ConfigProvider,
  ExceptionMap,
  PRESENTED_IMAGE_403,
  PRESENTED_IMAGE_404,
  PRESENTED_IMAGE_500,
  Result,
} from '../../packages/ui/dist/index.mjs';

assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
const results = [];
const check = async (name, run) => {
  try {
    await run();
    results.push({ name, passed: true });
  } catch (e) {
    results.push({ name, passed: false, error: e.message });
  }
};
const render = (vnode) => renderToString(createSSRApp({ render: () => vnode }));
await check('native root attributes and string styles survive production SSR', async () => {
  const html = await render(
    h(Result, {
      id: 'server-result',
      role: 'region',
      tabindex: 0,
      style: 'padding:13px',
      title: 'Server title',
    }),
  );
  for (const text of [
    'id="server-result"',
    'role="region"',
    'tabindex="0"',
    'padding:13px',
    'Server title',
  ])
    assert.ok(html.includes(text), text);
});
await check('all four source tokens and semantic defaults exist before mount', async () => {
  const html = await render(
    h(
      ConfigProvider,
      {
        theme: {
          components: {
            Result: {
              titleFontSize: 29,
              subtitleFontSize: '1.25rem',
              iconFontSize: 84,
              extraMargin: '31px 0 0',
            },
          },
        },
      },
      () => h(Result, { classNames: ({ props }) => ({ root: `current-${props.status}` }) }),
    ),
  );
  for (const text of [
    '--apollo-result-title-font-size:29px',
    '--apollo-result-subtitle-font-size:1.25rem',
    '--apollo-result-icon-font-size:84px',
    '--apollo-result-extra-margin:31px 0 0',
    'current-info',
  ])
    assert.ok(html.includes(text), text);
});
for (const status of [403, '404', 500]) {
  await check(`${status} uses complete native icon content before mount`, async () => {
    const html = await render(
      h(
        Result,
        { status, icon: false },
        {
          icon: () => [
            h('label', 'Draft'),
            h('input', { 'aria-label': 'Server draft' }),
            h('strong', 'Tail'),
          ],
        },
      ),
    );
    assert.ok(html.includes('Server draft') && html.includes('Tail'));
    assert.ok(
      !html.includes('<svg') &&
        !html.includes('apollo-result-image') &&
        !html.includes('aria-hidden'),
    );
  });
}
await check('present empty slots suppress fallbacks and empty containers', async () => {
  const html = await render(
    h(
      Result,
      { status: 404, title: 'Old title', subTitle: 'Old description' },
      { icon: () => [], title: () => [], subTitle: () => [], extra: () => [], default: () => [] },
    ),
  );
  for (const text of [
    '<svg',
    'Old title',
    'Old description',
    'apollo-result-body',
    'apollo-result-extra',
    'apollo-result-title',
  ])
    assert.ok(!html.includes(text), text);
});
await check('default exception graphics are hidden while zero body text remains', async () => {
  const html = await render(h(Result, { status: 404 }, { default: () => 0 }));
  assert.ok(html.includes('aria-hidden="true"') && html.includes('focusable="false"'));
  assert.ok(html.includes('apollo-result-body') && html.includes('>0<'));
});
await check('all static exports preserve identity and independent SVG roots', async () => {
  assert.equal(PRESENTED_IMAGE_403, ExceptionMap[403]);
  assert.equal(PRESENTED_IMAGE_404, ExceptionMap[404]);
  assert.equal(PRESENTED_IMAGE_500, ExceptionMap[500]);
  const html = await render(
    h('div', [
      h(PRESENTED_IMAGE_404, { 'aria-label': 'First' }),
      h(PRESENTED_IMAGE_404, { 'aria-label': 'Second' }),
    ]),
  );
  assert.equal((html.match(/<svg /g) ?? []).length, 2);
  assert.ok(html.includes('aria-label="First"') && html.includes('aria-label="Second"'));
});
const report = { results, browserGlobals: false };
writeFileSync(
  process.env.RESULT_SSR_EVIDENCE ?? '/tmp/apollo-result-ssr.json',
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(report);
assert.ok(results.every((r) => r.passed));
