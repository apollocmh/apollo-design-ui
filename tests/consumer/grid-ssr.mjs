/** Frozen published Grid SSR; run only after the integrated UI dist-ready notice. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Col as SubpathCol, Row as SubpathRow } from '../../packages/ui/dist/grid/index.mjs';
import { Col, ConfigProvider, Row } from '../../packages/ui/dist/index.mjs';

assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
const results = [],
  warnings = [];
for (const [name, RowComponent, ColComponent] of [
  ['root', Row, Col],
  ['subpath', SubpathRow, SubpathCol],
]) {
  for (const gutter of [
    0,
    [10.5, 7.5],
    [
      { xs: 8, md: 24 },
      { xs: '1rem', md: 12 },
    ],
  ]) {
    const app = createSSRApp({
      render: () =>
        h(
          ConfigProvider,
          {
            direction: 'rtl',
            components: {
              row: { className: 'server-row', style: { padding: '3px' } },
              col: { className: 'server-col', style: { paddingBlock: '5px' } },
            },
          },
          () =>
            h(RowComponent, { gutter, style: 'width: 300px', wrap: false }, () =>
              h(
                ColComponent,
                {
                  span: 12,
                  xs: { flex: 'auto' },
                  md: { span: 8, offset: 0 },
                  style: ['height: 30px', { paddingBlock: '7px' }],
                },
                () => [h('strong', 'Complete'), ' server', 0],
              ),
            ),
        ),
    });
    app.config.warnHandler = (message) => warnings.push(message);
    const html = await renderToString(app);
    for (const expected of [
      'server-row',
      'server-col',
      'dir="rtl"',
      'width:300px',
      'height:30px',
      'padding-block:7px',
      'apollo-col-md-offset-0',
      '<strong>Complete</strong> server0',
    ])
      assert.ok(html.includes(expected), `${name}: ${expected}`);
    assert.ok(!html.includes('style=""'));
    assert.ok(!html.includes('0:w;'));
    results.push({ name, gutter, passed: true });
  }
}
assert.deepEqual(warnings, []);
writeFileSync(
  process.env.GRID_SSR_EVIDENCE ?? '/tmp/apollo-grid-published-ssr.json',
  `${JSON.stringify({ sourceAliases: false, browserGlobals: false, results, warnings }, null, 2)}\n`,
);
console.log(
  'PASS published Grid root/subpath SSR, complete content/native styles and current Provider configuration',
);
