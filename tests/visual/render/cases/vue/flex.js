/**
 * Vue 侧（@apollo-design/ui）的 Flex 视觉用例。
 *
 * 与 `render/cases/react/flex.jsx` **逐条对应**。用 `h()` 而不是 SFC（divider 同理）。
 * ⚠️ `style` 值全部写成字符串（单位补全的平台差异，见 React 侧文件头）。
 * ⚠️ gap 数字写成字符串 `'16px'`（两侧等形；数字路径已由 L4 钉死）。
 */

import { Flex } from '@apollo-design/ui';
import { h } from 'vue';

/** 视觉对比用的色块（硬编码色在用例里是测试固件，不是组件实现 —— H9 不适用此处）。 */
const box = (bg, width = '25%', height = '54px') =>
  h('div', { style: { width, height, backgroundColor: bg } });

const boxes = (n, bg1 = '#1677ff', bg2 = '#1677ffbf', width = '25%', height = '54px') =>
  Array.from({ length: n }, (_, i) => box(i % 2 ? bg2 : bg1, width, height));

export default {
  // ---- 1. basic：水平默认 + vertical 切换 ----------------------------------
  basic: () => [
    h(Flex, { gap: 'medium', vertical: true }, { default: () => boxes(4) }),
    h(Flex, { gap: 'medium' }, { default: () => boxes(4) }),
  ],

  // ---- 2. vertical：主轴垂直（含 orientation 路径）-------------------------
  vertical: () => [
    h(Flex, { vertical: true }, { default: () => boxes(3) }),
    h(Flex, { orientation: 'vertical' }, { default: () => boxes(3) }),
    h(Flex, { orientation: 'horizontal', vertical: true }, { default: () => boxes(3) }),
  ],

  // ---- 3. gap：三档预设 + 自定义 -------------------------------------------
  gap: () => [
    h(Flex, { gap: 'small' }, { default: () => boxes(3, '#1677ff', '#1677ffbf', '80px') }),
    h(Flex, { gap: 'medium' }, { default: () => boxes(3, '#1677ff', '#1677ffbf', '80px') }),
    h(Flex, { gap: 'large' }, { default: () => boxes(3, '#1677ff', '#1677ffbf', '80px') }),
    h(Flex, { gap: '16px' }, { default: () => boxes(3, '#1677ff', '#1677ffbf', '80px') }),
  ],

  // ---- 4. wrap：多行换行 ----------------------------------------------------
  wrap: () =>
    h(
      Flex,
      { wrap: true, gap: 'small' },
      { default: () => boxes(12, '#1677ff', '#1677ffbf', '120px') },
    ),

  // ---- 5. justify / align：对齐方式 ----------------------------------------
  'justify-align': () => [
    h('div', { style: { width: '100%', height: '120px', border: '1px solid #40a9ff' } }, [
      h(
        Flex,
        { justify: 'space-between', align: 'center', style: { height: '100%' } },
        { default: () => boxes(3, '#1677ff', '#1677ffbf', '60px') },
      ),
    ]),
    h('div', { style: { width: '100%', height: '120px', border: '1px solid #40a9ff' } }, [
      h(
        Flex,
        { justify: 'center', align: 'flex-end', style: { height: '100%' } },
        { default: () => boxes(3, '#1677ff', '#1677ffbf', '60px') },
      ),
    ]),
    h(
      Flex,
      { vertical: true, justify: 'space-around', align: 'center', style: { height: '160px' } },
      {
        default: () => boxes(3, '#1677ff', '#1677ffbf', '40px'),
      },
    ),
  ],
};
