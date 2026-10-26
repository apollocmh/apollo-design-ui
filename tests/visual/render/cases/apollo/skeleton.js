import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import {
  ConfigProvider,
  Skeleton,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonImage,
  SkeletonInput,
  SkeletonNode,
} from '@apollo-design/ui';
import { createCommentVNode, h } from 'vue';

const captions = {
  basic: 'Article placeholder',
  avatar: 'Avatar and rounded blocks',
  paragraph: 'Individual line widths',
  'loaded-content': 'Unwrapped business content',
  elements: 'Standalone native roots',
  'image-content': 'Default, custom and empty image content',
  'node-content': 'Complete native custom content',
  tokens: 'Current source component tokens',
  rtl: 'Right to left placeholders',
  'theme-dark': 'Dark placeholders',
  'theme-compact': 'Compact placeholders',
  'theme-dark-compact': 'Dark compact placeholders',
  'native-focus': 'Native keyboard focus',
};
const frame = (name, children) =>
  h(
    'main',
    {
      'data-skeleton-visual-case': name,
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
      h('h1', { style: { margin: '0 0 12px', fontSize: '20px' } }, 'Skeleton workspace'),
      h('h2', { style: { margin: '0 0 16px', fontSize: '14px' } }, captions[name]),
      ...children,
    ],
  );
const bone = (props = {}, slots) => h(Skeleton, { id: 'bone-main', ...props }, slots);
const row = (children) =>
  h(
    'div',
    { style: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' } },
    children,
  );
const draft = (id, value = 'Saved draft') =>
  h('input', {
    id,
    value,
    'aria-label': 'Skeleton workspace draft',
    style: { display: 'block', width: '160px', maxWidth: '100%', fontSize: '14px' },
  });
const node = (focus = false) =>
  h(
    SkeletonNode,
    {
      id: 'bone-main',
      style: { width: '100%' },
      styles: {
        content: {
          width: '100%',
          height: 'auto',
          minHeight: '90px',
          padding: '12px',
          color: 'var(--apollo-color-text)',
          background: 'var(--apollo-color-bg-container)',
        },
      },
    },
    {
      default: () => [
        createCommentVNode('leading'),
        h('label', ['Task draft', draft(focus ? 'bone-focus-draft' : 'bone-draft')]),
        h('b', 'Native tail'),
      ],
    },
  );
const themed = (name, algorithm) =>
  h(ConfigProvider, { theme: { algorithm } }, () => frame(name, [bone({ avatar: true })]));
export default {
  basic: () => frame('basic', [bone()]),
  avatar: () =>
    frame('avatar', [
      bone({ avatar: true }),
      bone({
        id: 'bone-second',
        avatar: true,
        round: true,
        paragraph: { rows: 2 },
        style: { marginTop: '20px' },
      }),
    ]),
  paragraph: () =>
    frame('paragraph', [
      bone({ title: { width: '70%' }, paragraph: { rows: 3, width: ['90%', '70%', '45%'] } }),
    ]),
  'loaded-content': () =>
    frame('loaded-content', [
      bone(
        { loading: false },
        {
          default: () => [h('p', 'Records are ready.'), draft('bone-loaded-draft', 'Loaded draft')],
        },
      ),
    ]),
  elements: () =>
    frame('elements', [
      row([
        h(SkeletonAvatar, { id: 'bone-main', size: 'large' }),
        h(SkeletonAvatar, { size: 'small', shape: 'square' }),
        h(SkeletonButton),
        h(SkeletonButton, { size: 'large', shape: 'round' }),
        h(SkeletonInput, { size: 'small' }),
      ]),
      h(SkeletonButton, { block: true, style: { marginTop: '16px' } }),
    ]),
  'image-content': () =>
    frame('image-content', [
      row([
        h(SkeletonImage, { id: 'bone-main' }),
        h(
          SkeletonImage,
          {
            styles: {
              content: {
                width: '180px',
                height: '110px',
                padding: '8px',
                flexDirection: 'column',
                alignItems: 'flex-start',
                color: 'var(--apollo-color-text)',
                background: 'var(--apollo-color-bg-container)',
              },
            },
          },
          {
            default: () => [
              h('label', ['Image draft', draft('bone-image-draft')]),
              h('b', 'Native tail'),
            ],
          },
        ),
        h(SkeletonImage, {}, { default: () => [] }),
      ]),
    ]),
  'node-content': () => frame('node-content', [node()]),
  tokens: () =>
    h(
      ConfigProvider,
      {
        theme: {
          components: {
            Skeleton: {
              gradientFromColor: '#dce8ff',
              gradientToColor: '#8cafff',
              titleHeight: 24,
              blockRadius: 8,
              paragraphLiHeight: 18,
              paragraphMarginTop: 32,
            },
          },
        },
      },
      () => frame('tokens', [bone({ avatar: true })]),
    ),
  rtl: () => h(ConfigProvider, { direction: 'rtl' }, () => frame('rtl', [bone({ avatar: true })])),
  'theme-dark': () => themed('theme-dark', darkAlgorithm),
  'theme-compact': () => themed('theme-compact', compactAlgorithm),
  'theme-dark-compact': () => themed('theme-dark-compact', [darkAlgorithm, compactAlgorithm]),
  'native-focus': () =>
    frame('native-focus', [
      h(
        'button',
        { id: 'bone-before', type: 'button', style: { marginBottom: '12px' } },
        'Before editor',
      ),
      node(true),
    ]),
};
