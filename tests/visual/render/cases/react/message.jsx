/**
 * React 侧（antd 6.6.4）的 Message 视觉用例。与 vue/message.js 逐条对应。
 *
 * ⚠️ 与 Vue 侧同判：命令式路径是 portal + 自动消失 ⇒ 用**静态面板**
 *    （`message._InternalPanelDoNotUseOrYouWillBeFired` / `_InternalList*`）。
 */

import { message } from 'antd';

const Panel = message._InternalPanelDoNotUseOrYouWillBeFired;
const List = message._InternalListDoNotUseOrYouWillBeFired;

const stage = (children) => (
  <div style={{ minHeight: 240, padding: 16, width: 420 }}>{children}</div>
);

export default {
  single: () => stage(<Panel type="success" content="This is a success message" />),

  types: () =>
    stage(
      <List
        items={[
          { key: '1', type: 'info', content: 'This is an info message' },
          { key: '2', type: 'success', content: 'This is a success message' },
          { key: '3', type: 'warning', content: 'This is a warning message' },
          { key: '4', type: 'error', content: 'This is an error message' },
        ]}
      />,
    ),

  custom: () =>
    stage(
      <Panel
        type="success"
        content="Custom semantic styles"
        styles={{
          root: {
            backgroundColor: '#f6ffed',
            border: '2px solid #95de64',
            borderRadius: 16,
            boxShadow: '4px 4px 0 #d9f7be',
          },
          icon: { color: '#237804' },
          title: { color: '#237804', fontWeight: 600 },
        }}
      />,
    ),
};
