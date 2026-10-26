/** Current Apollo loading content, geometry, themes and native focus. */
import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, Spin } from '@apollo-design/ui';
import { createCommentVNode, h } from 'vue';

const spin = (props = {}, slots) => h(Spin, { id: 'spin-main', ...props }, slots);
const editor = () =>
  h('input', {
    id: 'spin-draft',
    'aria-label': 'Loading draft',
    value: 'Review draft',
    style: { width: '150px', maxWidth: '100%' },
  });
const body = () =>
  h(
    'div',
    {
      style: {
        minHeight: '120px',
        padding: '16px',
        border: '1px solid var(--apollo-color-border)',
      },
    },
    [h('p', 'Current work stays in its native container.'), editor()],
  );
const frame = (name, children) =>
  h(
    'main',
    {
      'data-spin-visual-case': name,
      style: {
        boxSizing: 'border-box',
        width: '100%',
        padding: '16px',
        minHeight: name === 'fullscreen' ? 'calc(100vh - 32px)' : '240px',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [
      h('h1', { style: { margin: '0 0 20px', fontSize: '20px' } }, 'Loading workspace'),
      ...children,
    ],
  );
const row = (children) =>
  h(
    'div',
    { style: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '24px' } },
    children,
  );
const sizes = () =>
  row([
    spin({ size: 'small' }),
    spin({ id: 'spin-medium' }),
    spin({ id: 'spin-large', size: 'large' }),
  ]);
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () =>
    frame(name, [
      sizes(),
      spin(
        { id: 'spin-themed-body', description: 'Updating workspace', style: { marginTop: '24px' } },
        { default: body },
      ),
    ]),
  );

export default {
  basic: () => frame('basic', [spin({ description: 'Updating workspace' })]),
  size: () => frame('size', [sizes()]),
  nested: () => frame('nested', [spin({ description: 'Updating workspace' }, { default: body })]),
  'empty-body': () =>
    frame('empty-body', [spin({ description: 'Waiting for content' }, { default: () => [] })]),
  'custom-indicator': () =>
    frame('custom-indicator', [
      spin(
        { percent: 37, styles: { indicator: { color: 'var(--apollo-color-text)' } } },
        {
          indicator: ({ percent }) => [
            createCommentVNode('conditional first child'),
            h('strong', 'Current progress'),
            h('span', { style: { marginLeft: '8px' } }, `${percent}%`),
          ],
          description: () => [h('span', 'Complete '), h('strong', 'native content')],
        },
      ),
    ]),
  percent: () =>
    frame('percent', [
      row(
        [0, 37, 100].map((percent, index) =>
          spin({
            id: index ? `spin-percent-${percent}` : 'spin-main',
            percent,
            description: `${percent}%`,
          }),
        ),
      ),
    ]),
  fullscreen: () =>
    frame('fullscreen', [
      spin({ fullscreen: true, description: 'Updating workspace' }, { default: body }),
    ]),
  'fullscreen-idle': () =>
    frame('fullscreen-idle', [spin({ fullscreen: true, spinning: false }, { default: body })]),
  semantic: () =>
    frame('semantic', [
      spin(
        {
          percent: 37,
          description: 'Semantic loading content',
          classNames: {
            root: 'spin-owned-root',
            section: 'spin-owned-section',
            indicator: 'spin-owned-indicator',
            description: 'spin-owned-description',
            container: 'spin-owned-container',
          },
          styles: {
            root: { padding: '12px', border: '2px solid #38598b' },
            indicator: { color: '#8b2b46', fontSize: '36px' },
            description: { fontWeight: 600 },
            container: { padding: '8px' },
          },
        },
        { default: body },
      ),
    ]),
  tokens: () =>
    h(
      ConfigProvider,
      {
        theme: {
          components: { Spin: { contentHeight: 96, dotSize: 31, dotSizeSM: 13, dotSizeLG: 47 } },
        },
      },
      () =>
        frame('tokens', [
          sizes(),
          spin(
            {
              id: 'spin-token-body',
              description: '96px loading layer',
              style: { marginTop: '24px' },
            },
            {
              default: () =>
                h(
                  'div',
                  { style: { height: '200px', border: '1px solid var(--apollo-color-border)' } },
                  '200px native body',
                ),
            },
          ),
        ]),
    ),
  rtl: () =>
    h(ConfigProvider, { direction: 'rtl' }, () =>
      frame('rtl', [spin({ description: 'Updating workspace' }, { default: body })]),
    ),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
  'native-focus': () =>
    frame('native-focus', [
      h('button', { id: 'spin-focus-before', type: 'button' }, 'Before indicator'),
      spin(
        {},
        {
          indicator: () => [
            createCommentVNode('conditional first child'),
            editor(),
            h('button', { type: 'button', style: { marginLeft: '8px' } }, 'Save'),
          ],
        },
      ),
    ]),
};
