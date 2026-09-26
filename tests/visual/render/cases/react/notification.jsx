/**
 * React 侧（antd 6.6.4）的 Notification 视觉用例。与 vue/notification.js 逐条对应。
 */

import { notification } from 'antd';

const Panel = notification._InternalPanelDoNotUseOrYouWillBeFired;
const List = notification._InternalListDoNotUseOrYouWillBeFired;

const stage = (children) => (
  <div style={{ minHeight: 240, padding: 16, width: 420 }}>{children}</div>
);

export default {
  basic: () =>
    stage(
      <Panel
        type="success"
        title="Notification Title"
        description="This is the content of the notification. This is the content of the notification."
      />,
    ),

  placement: () =>
    stage(
      <List
        placement="bottomRight"
        items={[
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
        ]}
      />,
    ),

  actions: () =>
    stage(
      <Panel
        title="Notification Title"
        description="A function will be called after the notification is closed."
        actions={<button type="button">Confirm</button>}
      />,
    ),
};
