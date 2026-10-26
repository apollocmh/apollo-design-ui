import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, IconMap, Result } from '@apollo-design/ui';
import { createCommentVNode, h } from 'vue';

const captions = {
  'info-success': 'Information and successful results',
  'warning-error': 'Warning and failed results',
  'exception-403': 'Access denied illustration',
  'exception-404': 'Missing page illustration',
  'exception-500': 'Server error illustration',
  'complete-content': 'Complete native icon and body',
  'empty-slots': 'Intentional empty content',
  tokens: 'Current source component tokens',
  rtl: 'Right to left content',
  'theme-dark': 'Dark result',
  'theme-compact': 'Compact result',
  'theme-dark-compact': 'Dark compact result',
  'native-focus': 'Native keyboard focus',
};
const frame = (name, children) =>
  h(
    'main',
    {
      'data-result-visual-case': name,
      style: {
        boxSizing: 'border-box',
        width: '100%',
        minHeight: '300px',
        padding: '16px',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [
      h('h1', { style: { margin: '0 0 12px', fontSize: '20px' } }, 'Result workspace'),
      h('h2', { style: { margin: '0 0 16px', fontSize: '14px' } }, captions[name]),
      ...children,
    ],
  );
const action = () => h('button', { type: 'button' }, 'Review details');
const result = (props = {}, slots = {}) =>
  h(
    Result,
    {
      id: 'result-main',
      role: 'region',
      'aria-label': 'Operation outcome',
      'data-native-result': 'yes',
      status: 'info',
      title: 'Operation result',
      subTitle: 'Please review the operation details.',
      ...props,
    },
    { extra: action, ...slots },
  );
const draft = (id, label) =>
  h('label', { style: { display: 'block' } }, [
    label,
    h('input', {
      id,
      'aria-label': label,
      value: 'Saved draft',
      style: {
        display: 'block',
        width: '140px',
        maxWidth: '100%',
        marginInline: 'auto',
        fontSize: '14px',
      },
    }),
  ]);
const complete = () =>
  result(
    { status: 404, icon: false },
    {
      title: () => [
        createCommentVNode('leading'),
        h('h3', { style: { font: 'inherit', margin: 0 } }, 'Result details'),
        h('span', 'Complete title'),
      ],
      subTitle: () => [h('span', 'Review current details. '), h('strong', 'Description tail')],
      icon: () => [
        createCommentVNode('leading'),
        h(IconMap.success),
        draft('result-icon-draft', 'Icon draft'),
        h('strong', { style: { display: 'block', marginTop: '8px' } }, 'Icon tail'),
      ],
      default: () => [
        createCommentVNode('leading'),
        draft('result-body-draft', 'Body draft'),
        h('strong', 'Body tail'),
      ],
    },
  );
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () => frame(name, [result()]));
export default {
  'info-success': () =>
    frame('info-success', [
      result({ title: 'Information available' }),
      result({ id: 'result-secondary', status: 'success', title: 'Changes saved' }),
    ]),
  'warning-error': () =>
    frame('warning-error', [
      result({ status: 'warning', title: 'Review required' }),
      result({ id: 'result-secondary', status: 'error', title: 'Submission failed' }),
    ]),
  'exception-403': () => frame('exception-403', [result({ status: 403, title: '403' })]),
  'exception-404': () => frame('exception-404', [result({ status: '404', title: '404' })]),
  'exception-500': () => frame('exception-500', [result({ status: 500, title: '500' })]),
  'complete-content': () => frame('complete-content', [complete()]),
  'empty-slots': () =>
    frame('empty-slots', [
      result(
        { status: 404 },
        { title: () => [], subTitle: () => [], icon: () => [], extra: () => [], default: () => [] },
      ),
    ]),
  tokens: () =>
    h(
      ConfigProvider,
      {
        theme: {
          components: {
            Result: {
              titleFontSize: 32,
              subtitleFontSize: 18,
              iconFontSize: 96,
              extraMargin: '16px 0 0',
            },
          },
        },
      },
      () => frame('tokens', [result({ status: 'success', title: 'Current component tokens' })]),
    ),
  rtl: () => h(ConfigProvider, { direction: 'rtl' }, () => frame('rtl', [complete()])),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
  'native-focus': () =>
    frame('native-focus', [
      h(
        'button',
        { id: 'result-before', type: 'button', style: { marginBottom: '12px' } },
        'Before editor',
      ),
      complete(),
    ]),
};
