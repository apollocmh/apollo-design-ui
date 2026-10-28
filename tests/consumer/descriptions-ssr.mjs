/** Published Node SSR contract; run after the shared UI build, without browser globals. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { ConfigProvider, Descriptions, DescriptionsItem } from '../../packages/ui/dist/index.mjs';

assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
const results = [];
for (const layout of ['horizontal', 'vertical']) {
  for (const bordered of [false, true]) {
    const ignored = () => {
      throw new Error('The data channel must not evaluate ignored slots');
    };
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            ConfigProvider,
            {
              theme: {
                components: { Descriptions: { itemPaddingBottom: 11, titleMarginBottom: 29 } },
              },
            },
            () =>
              h(
                Descriptions,
                { id: 'published-descriptions', column: 2, layout, bordered },
                {
                  title: () => [h('b', 'Server'), ' title'],
                  extra: () => h('button', { type: 'button' }, 'Server action'),
                  default: () =>
                    h(
                      DescriptionsItem,
                      {
                        key: 'a',
                        label: 'Fallback',
                        id: 'own-field',
                        class: 'own-item',
                        style: ['padding:4px', { width: '100%' }],
                      },
                      {
                        label: () => [h('b', 'Server'), ' label'],
                        default: () => [
                          h('input', { value: 'Server draft', 'aria-label': 'Server draft' }),
                          0,
                        ],
                      },
                    ),
                },
              ),
          ),
      }),
    );
    for (const content of [
      '<dl',
      '<dt',
      '<dd',
      'Server</b> label',
      'Server draft',
      'id="own-field"',
      '--apollo-descriptions-item-padding-bottom:11px',
    ])
      assert.ok(html.includes(content), `${layout}/${bordered}: ${content}`);
    assert.ok(!html.includes('<table'));
    const data = await renderToString(
      createSSRApp({ render: () => h(Descriptions, { items: [] }, { default: ignored }) }),
    );
    assert.ok(data.includes('<dl'));
    results.push({ layout, bordered, passed: true });
  }
}
writeFileSync(
  process.env.DESCRIPTIONS_SSR_EVIDENCE ?? '/tmp/apollo-descriptions-published-ssr.json',
  `${JSON.stringify({ results, browserGlobals: false }, null, 2)}\n`,
);
console.log(
  'PASS published Descriptions SSR in all four layouts, complete native slots/attrs, current tokens and empty-data precedence',
);
