/** Apollo-owned Image states use the current public Vue API and local artwork. */
import { compactAlgorithm, darkAlgorithm } from '@apollo-design/theme';
import { ConfigProvider, Image, ImagePreviewGroup } from '@apollo-design/ui';
import { h } from 'vue';

const artwork = (background) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="140" viewBox="0 0 240 140"><rect width="240" height="140" fill="${background}"/><circle cx="184" cy="30" r="17" fill="#f3d36a"/><path d="M0 140 68 82 124 140M76 140 154 72 240 140" fill="#dce7eb"/></svg>`)}`;
const first = artwork('#38598b');
const second = artwork('#27675b');
const items = [
  { src: first, alt: 'Blue mountain', width: 240, height: 140 },
  { src: second, alt: 'Green mountain', width: 240, height: 140 },
];
const frame = (name, children, full = false) =>
  h(
    'section',
    {
      'data-image-visual-case': name,
      style: {
        boxSizing: 'border-box',
        minHeight: full ? 'calc(100vh - 32px)' : '320px',
        width: '100%',
        padding: '16px',
        color: 'var(--apollo-color-text)',
        background: 'var(--apollo-color-bg-container)',
        fontFamily: 'var(--apollo-font-family)',
        fontSize: 'var(--apollo-font-size)',
      },
    },
    [h('h2', { style: { fontSize: '18px', margin: '0 0 16px' } }, 'Image gallery'), ...children],
  );
const gallery = (name, current = 0) =>
  frame(
    name,
    [
      h(ImagePreviewGroup, { items, open: true, current }, () =>
        items.map((item) => h(Image, { ...item, width: 120, height: 70 })),
      ),
    ],
    true,
  );

export default {
  basic: () =>
    frame('basic', [h(Image, { src: first, alt: 'Blue mountain', width: 200, height: 120 })]),
  cover: () =>
    frame('cover', [
      h(Image, {
        src: first,
        alt: 'Mountain preview',
        width: 160,
        height: 100,
        preview: { cover: { placement: 'center', coverNode: 'PREVIEW' } },
      }),
    ]),
  preview: () =>
    frame(
      'preview',
      [h(Image, { src: first, alt: 'Blue mountain', width: 240, height: 140, open: true })],
      true,
    ),
  rich: () =>
    frame('rich', [
      h(
        Image,
        { src: first, alt: 'Editable mountain', width: 240, height: 140 },
        {
          imageRender: ({ originNode }) =>
            h('figure', { style: { margin: 0, display: 'grid', gap: '8px' } }, [
              originNode,
              h('figcaption', 'Mountain caption'),
              h('input', {
                'aria-label': 'Image caption',
                value: 'Editable caption',
                style: { font: 'inherit' },
              }),
              h('button', { type: 'button', style: { font: 'inherit' } }, 'Save caption'),
            ]),
        },
      ),
    ]),
  progress: () =>
    frame('progress', [
      h(Image, {
        width: 260,
        height: 180,
        placeholder: {
          progress: {
            percent: 65,
            render: (bar) =>
              h(
                'div',
                { style: { display: 'grid', gap: '8px', color: 'var(--apollo-color-text)' } },
                [
                  bar,
                  h('label', [
                    'Download note',
                    h('input', { value: 'Local photo', style: { font: 'inherit' } }),
                  ]),
                  h('button', { type: 'button', style: { font: 'inherit' } }, 'Cancel download'),
                ],
              ),
          },
        },
      }),
    ]),
  group: () => gallery('group', 1),
  'theme-dark': () =>
    h(ConfigProvider, { theme: { algorithm: darkAlgorithm } }, () => gallery('theme-dark')),
  'theme-compact': () =>
    h(ConfigProvider, { theme: { algorithm: compactAlgorithm } }, () => gallery('theme-compact')),
};
