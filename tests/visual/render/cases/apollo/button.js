import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { Button, ConfigProvider, Input, SpaceCompact } from '@apollo-design/ui';
import { createCommentVNode, h } from 'vue';
import reference from '../vue/button.js';

const button = (text, props = {}, slots = {}) =>
  h(Button, props, { default: () => text, ...slots });
const icon = () => h('span', { 'aria-hidden': 'true' }, '✓');
const row = (children) =>
  h(
    'div',
    {
      style: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '16px',
      },
    },
    children,
  );
const frame = (name, children) =>
  h(
    'main',
    {
      'data-button-visual-case': name,
      style: {
        boxSizing: 'border-box',
        width: '100%',
        minHeight: '260px',
        padding: '16px',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [
      h('h1', { style: { margin: '0 0 12px', fontSize: '20px' } }, 'Button workspace'),
      h('h2', { style: { margin: '0 0 16px', fontSize: '14px' } }, name),
      ...children,
    ],
  );
const standard = () =>
  row([
    button('Primary', { type: 'primary' }),
    button('Default'),
    button('Dashed', { type: 'dashed' }),
    button('Text', { type: 'text' }),
    button('Link', { href: '#details', type: 'link' }),
    button('确定', { type: 'primary' }),
  ]);
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () => frame(name, [standard()]));

export default {
  // Preserve the original approved scenario and all separate upstream cases.
  type: () => h('main', { 'data-button-visual-case': 'type' }, [reference.type()]),
  'complete-content': () =>
    frame('complete-content', [
      row([
        button(
          [
            createCommentVNode('leading'),
            h('span', 'Complete '),
            h('strong', 'business content'),
            ' 0',
          ],
          { type: 'primary' },
          { icon: () => [createCommentVNode('icon'), icon()] },
        ),
        button('确定'),
        button('Icon after content', { iconPlacement: 'end' }, { icon }),
      ]),
    ]),
  'loading-states': () =>
    frame('loading-states', [
      row([
        button('Saving changes', { type: 'primary', loading: true }),
        button('Custom indicator', {
          loading: { delay: 0, icon: h('span', { 'aria-hidden': 'true' }, '…') },
        }),
        button('Pending link', { href: '#pending', loading: { delay: 0, icon: false } }),
      ]),
    ]),
  'native-disabled': () =>
    frame('native-disabled', [
      row([
        button('Disabled primary', { type: 'primary', disabled: true }),
        button('Disabled default', { disabled: true }),
        button('Disabled link', { href: '#disabled', disabled: true }),
        button('Enabled link', { href: '#enabled' }),
      ]),
    ]),
  shapes: () =>
    frame(
      'shapes',
      ['small', 'middle', 'large'].map((size) =>
        row([
          button(`Size ${size}`, { size }),
          button('Round', { size, shape: 'round' }),
          button(null, { size, shape: 'square', 'aria-label': `Square ${size}` }, { icon }),
          button(null, { size, shape: 'circle', 'aria-label': `Circle ${size}` }, { icon }),
        ]),
      ),
    ),
  'semantic-tokens': () =>
    h(
      ConfigProvider,
      {
        theme: {
          components: {
            Button: {
              fontWeight: 650,
              iconGap: 12,
              paddingInline: 24,
              contentFontSize: 16,
              contentLineHeight: 1.5,
            },
          },
        },
      },
      () =>
        frame('semantic-tokens', [
          row([
            button('Source tokens', {}, { icon }),
            button(
              'Owned content',
              { styles: { content: { textDecoration: 'underline' }, icon: { fontSize: '20px' } } },
              { icon },
            ),
            button('Native variable', { style: '--apollo-btn-padding-inline: 10px' }),
          ]),
        ]),
    ),
  'current-provider': () =>
    h(ConfigProvider, { components: { button: { shape: 'round', color: 'primary' } } }, () =>
      frame('current-provider', [
        row([
          button('Inherited shape and color'),
          button('Explicit variant', { variant: 'outlined' }),
          h(ConfigProvider, { componentDisabled: true }, () => button('Nested disabled')),
          button('Local square', { shape: 'square', color: 'default' }),
        ]),
      ]),
    ),
  'compact-layout': () =>
    frame('compact-layout', [
      h(SpaceCompact, { style: { maxWidth: '100%', marginBottom: '16px' } }, () => [
        h(Input, { 'aria-label': 'Search draft', value: 'Saved draft', style: { width: '140px' } }),
        button('Search', { type: 'primary' }),
      ]),
      h(SpaceCompact, { orientation: 'vertical' }, () => [
        button('First'),
        button('Middle'),
        button('Last'),
      ]),
    ]),
  rtl: () =>
    h(ConfigProvider, { direction: 'rtl' }, () =>
      frame('rtl', [
        row([
          button('إجراء أساسي', { type: 'primary' }, { icon }),
          button('Trailing icon', { iconPlacement: 'end' }, { icon }),
        ]),
      ]),
    ),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
  'native-focus': () =>
    frame('native-focus', [
      row([
        h('input', {
          id: 'button-before',
          'aria-label': 'Previous draft',
          value: 'Saved draft',
          style: { width: '120px' },
        }),
        button('Focused action', { id: 'button-focus', type: 'primary' }),
        button('Next action'),
      ]),
    ]),
};
