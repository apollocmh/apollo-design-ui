/**
 * Vue 侧（@apollo-design/ui）的 Drawer 视觉用例。与 react/drawer.jsx 逐条对应。
 *
 * ⚠️ 用**受控 open + `getContainer: false`（内联）**：
 *    - 受控 open ⇒ 静态帧稳定（动效由 harness 的 motion 相位剥离保证）；
 *    - 内联 ⇒ 不 portal、不 push 页面，避免污染同一次运行里其他组件的截图。
 */

import { Drawer } from '@apollo-design/ui';
import { h } from 'vue';

const stage = (children) =>
  h(
    'div',
    { style: { position: 'relative', minHeight: '420px', width: '640px', overflow: 'hidden' } },
    children,
  );

export default {
  // 右抽屉（默认方位）+ 标题 + extra + 页脚
  basic: () =>
    stage([
      h(
        Drawer,
        {
          open: true,
          getContainer: false,
          title: 'Drawer Title',
          extra: 'Extra',
          footer: 'Footer',
        },
        { default: () => h('p', null, 'Some contents...') },
      ),
    ]),

  // 左抽屉 + 尺寸预设 large（736px）
  size: () =>
    stage([
      h(
        Drawer,
        {
          open: true,
          getContainer: false,
          placement: 'left',
          size: 'large',
          title: 'Large Left',
        },
        { default: () => h('p', null, 'Some contents...') },
      ),
    ]),

  // 底部抽屉（垂直方位：高度轴 + 无遮罩）
  bottom: () =>
    stage([
      h(
        Drawer,
        {
          open: true,
          getContainer: false,
          placement: 'bottom',
          mask: false,
          title: 'Bottom',
        },
        { default: () => h('p', null, 'Some contents...') },
      ),
    ]),
};
