/** Production ESM must render current loading content without browser globals. */
import assert from 'node:assert/strict';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider, Spin, setDefaultIndicator } from '../../packages/ui/dist/index.mjs';

assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
const checks = [];
const render = (node) => renderToString(createSSRApp({ render: () => node }));
for (const percent of [undefined, 0, 42, -5, 150, Number.NaN]) {
  const html = await render(
    h(
      Spin,
      { percent },
      { default: () => h('input', { value: 'Server draft', 'aria-label': 'Draft' }) },
    ),
  );
  assert.ok(html.includes('value="Server draft"'));
  if (typeof percent === 'number' && Number.isFinite(percent)) {
    assert.ok(html.includes('role="progressbar"'));
    assert.ok(html.includes(`aria-valuenow="${Math.max(0, Math.min(100, percent))}"`));
    assert.ok(html.includes('aria-label="Loading progress"'));
  } else assert.ok(!html.includes('role="progressbar"'));
  assert.ok(!html.includes('NaN'));
  checks.push({ name: `SSR percent ${String(percent)}`, passed: true });
}
const custom = await render(
  h(
    Spin,
    { percent: 37 },
    {
      indicator: ({ percent }) => [
        h('output', { class: 'custom-output' }, String(percent)),
        h('input', { 'aria-label': 'Custom draft' }),
      ],
    },
  ),
);
assert.ok(custom.includes('<output class="custom-output">37</output>'));
assert.ok(custom.includes('aria-label="Custom draft"'));
checks.push({ name: 'SSR complete scoped content and original child attributes', passed: true });
const themed = await render(
  h(
    ConfigProvider,
    { theme: { components: { Spin: { dotSize: 31, contentHeight: 96 } } } },
    { default: () => h(Spin) },
  ),
);
assert.ok(themed.includes('--apollo-spin-dot-size:31px'));
assert.ok(themed.includes('--apollo-spin-content-height:96px'));
checks.push({ name: 'SSR current component tokens', passed: true });
setDefaultIndicator(0);
try {
  assert.match(await render(h(Spin)), />0</);
  checks.push({ name: 'SSR global numeric content', passed: true });
} finally {
  setDefaultIndicator(undefined);
}
console.log(JSON.stringify({ node: process.version, checks }, null, 2));
