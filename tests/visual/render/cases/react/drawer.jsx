/**
 * React 侧（antd 6.6.4）的 Drawer 视觉用例。与 vue/drawer.js 逐条对应。
 */

import { Drawer } from 'antd';

const stage = (children) => (
  <div style={{ position: 'relative', minHeight: 420, width: 640, overflow: 'hidden' }}>
    {children}
  </div>
);

export default {
  basic: () =>
    stage(
      <Drawer open getContainer={false} title="Drawer Title" extra="Extra" footer="Footer">
        <p>Some contents...</p>
      </Drawer>,
    ),

  size: () =>
    stage(
      <Drawer open getContainer={false} placement="left" size="large" title="Large Left">
        <p>Some contents...</p>
      </Drawer>,
    ),

  bottom: () =>
    stage(
      <Drawer open getContainer={false} placement="bottom" mask={false} title="Bottom">
        <p>Some contents...</p>
      </Drawer>,
    ),
};
