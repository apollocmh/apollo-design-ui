/**
 * Vue 侧（@apollo-design/ui）的 Tour 视觉用例。与 react/tour.jsx 逐条对应。
 *
 * ⚠️ 浮层用 open 受控静态帧钉住（与 popconfirm / dropdown 同判）；
 *    纯面板形态走 PurePanel（无需 portal）。
 */

import { Button, Tour, TourPurePanel } from '@apollo-design/ui';
import { h, ref } from 'vue';

const box = (children) =>
  h(
    'div',
    { style: { minHeight: '220px', padding: '24px', display: 'flex', alignItems: 'flex-end' } },
    children,
  );

export default {
  // 单步 + 目标元素 + 蒙层（挖洞 + 面板 bottom）
  basic: () => {
    const target = ref(null);
    return box(
      h('div', { style: { position: 'relative', width: '100%' } }, [
        h(
          Button,
          {
            ref: target,
            type: 'primary',
            style: { marginLeft: '40px' },
          },
          { default: () => 'Target' },
        ),
        h(Tour, {
          open: true,
          current: 0,
          steps: [
            {
              title: 'Upload File',
              description: 'Put your files here.',
              target: () => target.value?.nativeElement ?? null,
            },
          ],
        }),
      ]),
    );
  },

  // 非模态 + primary（mask=false，面板完整可见）
  'non-modal': () => {
    const target = ref(null);
    return box(
      h('div', { style: { position: 'relative', width: '100%' } }, [
        h(
          Button,
          {
            ref: target,
            style: { marginLeft: '40px' },
          },
          { default: () => 'Target' },
        ),
        h(Tour, {
          open: true,
          type: 'primary',
          mask: false,
          current: 0,
          steps: [
            {
              title: 'Save',
              description: 'Save your changes.',
              target: () => target.value?.nativeElement ?? null,
            },
          ],
        }),
      ]),
    );
  },

  // PurePanel 静态面板（default + primary 堆叠）
  'render-panel': () =>
    box(
      h('div', { style: { display: 'flex', flexDirection: 'column', rowGap: '16px' } }, [
        h(TourPurePanel, { title: 'Hello World!', description: 'Hello World?!' }),
        h(TourPurePanel, {
          title: 'Hello World!',
          description: 'Hello World?!',
          type: 'primary',
          current: 4,
          total: 5,
        }),
      ]),
    ),
};
