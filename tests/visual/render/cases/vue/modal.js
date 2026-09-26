/**
 * Vue 侧（@apollo-design/ui）的 Modal 视觉用例。与 react/modal.jsx 逐条对应。
 *
 * ⚠️ 用例全部走**内联渲染**（受控 `open` + `getContainer={false}`）或 **PurePanel**：
 *    portal 出来的浮层会盖住别的组件、且动效相位不稳定（与 drawer 同判，PITFALLS 177）。
 */

import { Modal } from '@apollo-design/ui';
import { h } from 'vue';

const PurePanel = Modal._InternalPanelDoNotUseOrYouWillBeFired;

const stage = (children) =>
  h(
    'div',
    { style: { position: 'relative', minHeight: '420px', width: '640px', overflow: 'hidden' } },
    children,
  );

export default {
  basic: () =>
    stage([
      h(
        Modal,
        { open: true, getContainer: false, title: 'Modal Title', width: 400 },
        { default: () => [h('p', null, 'Some contents...'), h('p', null, 'Some contents...')] },
      ),
    ]),

  // ⚠️ 正文走 **slot** —— antd 的 PurePanel 在 type 分支里把 children 当 content，
  //    `content` prop 被忽略
  confirm: () =>
    stage([
      h(
        PurePanel,
        { type: 'confirm', title: 'Do you want to delete?' },
        {
          default: () => 'Some descriptions.',
        },
      ),
    ]),

  loading: () =>
    stage([
      h(
        Modal,
        { open: true, getContainer: false, loading: true, title: 'Loading', width: 400 },
        { default: () => h('p', null, 'Some contents...') },
      ),
    ]),
};
