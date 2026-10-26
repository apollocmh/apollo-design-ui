/** Published statistic components must render without browser globals or timer effects. */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import {
  ConfigProvider,
  Statistic,
  StatisticCountdown,
  StatisticTimer,
} from '../../packages/ui/dist/index.mjs';

assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
const results = [],
  events = [];
for (const [name, component, props] of [
  ['number', Statistic, { value: '1234.50', precision: 2 }],
  ['countdown', StatisticTimer, { type: 'countdown', value: 0 }],
  ['countup', StatisticTimer, { type: 'countup', value: 0 }],
  ['Countdown export', StatisticCountdown, { value: 0 }],
]) {
  try {
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            component,
            {
              ...props,
              id: 'server-statistic',
              onFinish: () => events.push('finish'),
              onChange: () => events.push('change'),
            },
            {
              title: () => h('b', 'Server title'),
              value: (scope) => [
                h('input', { value: 'Server draft', 'aria-label': 'Server draft' }),
                h('output', `${scope.text}|${scope.duration ?? 'none'}`),
              ],
            },
          ),
      }),
    );
    assert.ok(html.includes('id="server-statistic"'));
    assert.ok(html.includes('Server title'));
    assert.ok(html.includes('Server draft'));
    assert.ok(html.includes(name === 'number' ? '1,234.50|none' : '-|none'));
    results.push({ name, passed: true });
  } catch (error) {
    results.push({ name, passed: false, error: error.message.split('\n')[0] });
  }
}
try {
  const html = await renderToString(
    createSSRApp({
      render: () =>
        h(
          ConfigProvider,
          { theme: { components: { Statistic: { titleFontSize: 18, contentFontSize: 42 } } } },
          () => h(Statistic, { value: 42 }),
        ),
    }),
  );
  assert.ok(html.includes('--apollo-statistic-title-font-size:18px'));
  assert.ok(html.includes('--apollo-statistic-content-font-size:42px'));
  results.push({ name: 'current source token SSR', passed: true });
} catch (error) {
  results.push({
    name: 'current source token SSR',
    passed: false,
    error: error.message.split('\n')[0],
  });
}
assert.deepEqual(events, []);
const report = { results, events };
writeFileSync(
  process.env.STATISTIC_SSR_EVIDENCE ?? '/tmp/apollo-statistic-ssr.json',
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(report);
assert.ok(results.every((r) => r.passed));
