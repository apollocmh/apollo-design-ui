/** Run after the integrated Flex dist-ready notice. No source aliases or browser globals. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { ThemeProvider } from '@apollo-design/theme';
import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { Flex as SubpathFlex } from '../../packages/ui/dist/flex/index.mjs';
import { ConfigProvider, Flex } from '../../packages/ui/dist/index.mjs';

assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
const results = [],
  warnings = [];
const CustomRoot = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () => h('section', attrs, slots.default?.());
  },
});
for (const [entry, Component] of [
  ['root', Flex],
  ['subpath', SubpathFlex],
])
  for (const component of ['article', CustomRoot]) {
    const app = createSSRApp({
      render: () =>
        h(
          ConfigProvider,
          {
            direction: 'rtl',
            components: {
              flex: { vertical: true, className: 'server-flex', style: { padding: '3px' } },
            },
          },
          () =>
            h(
              ThemeProvider,
              { theme: { token: { paddingXS: 19, padding: 23, paddingLG: 29 } } },
              () =>
                h(
                  Component,
                  { component, gap: 0, flex: 0, style: ['padding:7px', { margin: '5px' }] },
                  () => [h('strong', 'Complete'), ' server', 0],
                ),
            ),
        ),
    });
    app.config.warnHandler = (m) => warnings.push(m);
    const html = await renderToString(app);
    for (const text of [
      'server-flex',
      'apollo-flex-vertical',
      'dir="rtl"',
      'padding:7px',
      'margin:5px',
      'gap:0px',
      '--apollo-padding-xs:19px',
      '<strong>Complete</strong> server0',
    ])
      assert.ok(html.includes(text), `${entry}: ${text}`);
    assert.ok(!html.includes('style=""'));
    assert.ok(!html.includes('[object Object]'));
    results.push({
      entry,
      component: typeof component === 'string' ? component : 'Vue component',
      passed: true,
    });
  }
assert.deepEqual(warnings, []);
writeFileSync(
  process.env.FLEX_SSR_EVIDENCE ?? '/tmp/apollo-flex-published-ssr.json',
  JSON.stringify({ sourceAliases: false, browserGlobals: false, results, warnings }, null, 2) +
    '\n',
);
console.log(
  'PASS published Flex root/subpath SSR, native/custom roots, current configuration, complete slots and scoped theme aliases',
);
