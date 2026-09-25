/**
 * Vue 侧（@apollo-design/ui）的 Image 视觉用例。与 react/image.jsx 逐条对应。
 */

import { Image } from '@apollo-design/ui';
import { h } from 'vue';

const PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export default {
  basic: () =>
    h('div', { style: { minHeight: '240px', padding: '16px', width: '420px' } }, [
      h(Image, { alt: 'basic', width: 200, height: 100, src: PX }),
    ]),

  cover: () =>
    h('div', { style: { minHeight: '240px', padding: '16px', width: '420px' } }, [
      h(Image, {
        alt: 'cover',
        width: 96,
        height: 96,
        src: PX,
        preview: { cover: { coverNode: 'PREVIEW', placement: 'center' } },
      }),
    ]),

  preview: () =>
    h('div', { style: { minHeight: '240px', padding: '16px', width: '420px' } }, [
      h(Image, {
        alt: 'preview',
        width: 96,
        height: 96,
        src: PX,
        preview: { open: true, src: PX },
      }),
    ]),
};
