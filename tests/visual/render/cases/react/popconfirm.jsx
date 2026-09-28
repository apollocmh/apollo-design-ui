/**
 * React 侧（antd 6.6.4）的 Popconfirm 视觉用例。与 vue/popconfirm.js 逐条对应。
 * basic / no-cancel / render-panel。
 */

import { Button, Popconfirm } from 'antd';

const PurePopconfirm = Popconfirm._InternalPanelDoNotUseOrYouWillBeFired;

const box = (children) => (
  <div style={{ minHeight: 200, padding: 24, display: 'flex', alignItems: 'flex-end' }}>
    {children}
  </div>
);

export default {
  basic: () =>
    box(
      <Popconfirm
        open
        placement="top"
        title="Delete the task"
        description="Are you sure to delete this task?"
        okText="Yes"
        cancelText="No"
      >
        <Button danger>Delete</Button>
      </Popconfirm>,
    ),

  'no-cancel': () =>
    box(
      <Popconfirm
        open
        placement="top"
        title="Delete the task"
        description="Are you sure to delete this task?"
        okText="Yes"
        showCancel={false}
      >
        <Button danger>Delete</Button>
      </Popconfirm>,
    ),

  'render-panel': () =>
    box(
      <PurePopconfirm
        title="Delete the task"
        description="Are you sure to delete this task?"
        okText="Yes"
        cancelText="No"
      />,
    ),
};
