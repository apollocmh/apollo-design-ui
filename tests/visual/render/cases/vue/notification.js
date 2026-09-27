/**
 * Vue 侧（@apollo-design/ui）的 Notification 视觉用例。与 react/notification.jsx 逐条对应。
 *
 * ⚠️ 命令式路径是 portal + 自动消失 ⇒ 三个 variant 都用**静态面板**
 *    （`_InternalPanel*` / `_InternalList*`），与 L4 同形态。
 */

import { notification } from '@apollo-design/ui';
import { h } from 'vue';

const Panel = notification._InternalPanelDoNotUseOrYouWillBeFired;
const List = notification._InternalListDoNotUseOrYouWillBeFired;

const stage = (children) =>
  h('div', { style: { minHeight: '240px', padding: '16px', width: '420px' } }, children);

export default {
  // 单条（success 图标 + 标题 + 描述 + 关闭按钮）
  basic: () =>
    stage([
      h(Panel, {
        type: 'success',
        title: 'Notification Title',
        description:
          'This is the content of the notification. This is the content of the notification.',
      }),
    ]),

  // 方位（bottomRight 的定位规则 —— message 没有这个概念）
  placement: () =>
    stage([
      h(List, {
        placement: 'bottomRight',
        items: [
          {
            key: 'a',
            type: 'info',
            title: 'Notification topRight',
            description: 'This is the content of the notification.',
          },
          {
            key: 'b',
            type: 'warning',
            title: 'Notification bottomRight',
            description: 'This is the content of the notification.',
          },
        ],
      }),
    ]),

  // actions 区（关闭按钮 + 操作按钮的几何）。C8-R2：actions 走 `#actions` 插槽
  actions: () =>
    stage([
      h(
        Panel,
        {
          title: 'Notification Title',
          description: 'A function will be called after the notification is closed.',
        },
        { actions: () => h('button', { type: 'button' }, 'Confirm') },
      ),
    ]),
};
