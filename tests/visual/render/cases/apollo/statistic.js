import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, Statistic, StatisticTimer } from '@apollo-design/ui';
import { createCommentVNode, h } from 'vue';

const captions = {
  basic: 'Formatted numeric value',
  units: 'Native units',
  loading: 'Loading placeholder',
  'value-content': 'Complete value content',
  'empty-slot': 'Intentional empty content',
  'timer-countdown': 'Remaining time',
  'timer-countup': 'Elapsed time',
  tokens: 'Current source font tokens',
  'theme-dark': 'Dark statistics',
  'theme-compact': 'Compact statistics',
  'theme-dark-compact': 'Dark compact statistics',
  'native-focus': 'Native clock keyboard focus',
};
const stat = (props = {}, slots) =>
  h(
    Statistic,
    { id: 'stat-main', title: 'Current balance', value: '112893.25', precision: 2, ...props },
    slots,
  );
const frame = (name, children) =>
  h(
    'main',
    {
      'data-statistic-visual-case': name,
      style: {
        boxSizing: 'border-box',
        width: '100%',
        minHeight: '280px',
        padding: '16px',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [
      h('h1', { style: { margin: '0 0 12px', fontSize: '20px' } }, 'Statistic workspace'),
      h('h2', { style: { margin: '0 0 16px', fontSize: '14px' } }, captions[name]),
      ...children,
    ],
  );
const valueContent = ({ text }) => [
  createCommentVNode('leading conditional'),
  h('input', {
    id: 'stat-focus-draft',
    'aria-label': 'Statistic workspace draft',
    value: 'Saved draft',
    style: { display: 'block', width: '160px', maxWidth: '100%', fontSize: '14px' },
  }),
  h('output', text),
];
const clock = (type, slots) =>
  h(
    StatisticTimer,
    {
      id: 'stat-main',
      type,
      value: Date.now() + (type === 'countdown' ? 1 : -1) * (2 * 86400000 + 3600000),
      format: 'D[ days]',
      title: type === 'countdown' ? 'Access expires in' : 'Elapsed time',
    },
    slots,
  );
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () => frame(name, [stat()]));
export default {
  basic: () => frame('basic', [stat()]),
  units: () => frame('units', [stat({ prefix: '↑', suffix: '%' })]),
  loading: () => frame('loading', [stat({ loading: true })]),
  'value-content': () => frame('value-content', [stat({}, { value: valueContent })]),
  'empty-slot': () =>
    frame('empty-slot', [
      stat(
        { prefix: 'Hidden prefix', suffix: 'Hidden suffix' },
        { title: () => [], prefix: () => [], suffix: () => [], value: () => [] },
      ),
    ]),
  'timer-countdown': () => frame('timer-countdown', [clock('countdown')]),
  'timer-countup': () => frame('timer-countup', [clock('countup')]),
  tokens: () =>
    h(
      ConfigProvider,
      { theme: { components: { Statistic: { titleFontSize: 18, contentFontSize: 42 } } } },
      () => frame('tokens', [stat()]),
    ),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
  'native-focus': () =>
    frame('native-focus', [
      h(
        'button',
        { id: 'stat-before', type: 'button', style: { marginBottom: '12px' } },
        'Before clock',
      ),
      clock('countup', { value: valueContent }),
    ]),
};
