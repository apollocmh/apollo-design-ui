/**
 * React 侧（antd 6.6.4）的 BackTop 视觉用例。与 vue/back-top.js 逐条对应。
 */

import { BackTop } from 'antd';

export default {
  basic: () => (
    <div style={{ height: '2000px' }}>
      <BackTop visibilityHeight={0} />
      <p style={{ fontFamily: 'sans-serif' }}>Scroll down to see the bottom-right.</p>
    </div>
  ),
};
