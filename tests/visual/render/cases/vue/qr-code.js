/**
 * Vue 侧（@apollo-design/ui）的 QRCode 视觉用例。与 react/qr-code.jsx 逐条对应。
 */

import { QrCode } from '@apollo-design/ui';
import { h } from 'vue';

const box = (children) => h('div', { style: { minHeight: '240px', padding: '16px' } }, children);

export default {
  basic: () =>
    box(h('div', { style: { width: '240px' } }, [h(QrCode, { value: 'https://apollo.design' })])),

  custom: () =>
    box(
      h('div', { style: { width: '240px' } }, [
        h(QrCode, {
          value: 'https://apollo.design',
          color: '#1677ff',
          bgColor: '#f0f5ff',
          size: 120,
        }),
      ]),
    ),

  svg: () =>
    box(
      h('div', { style: { width: '240px' } }, [
        h(QrCode, { value: 'https://apollo.design', type: 'svg', size: 120 }),
      ]),
    ),
};
